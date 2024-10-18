import os
import io
import swiftclient
import hashlib
from PIL import Image
from PIL.ExifTags import TAGS
from typing import List
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import HTMLResponse
from typing_extensions import Annotated
import requests
from dotenv import load_dotenv
import os
import couchdb 
import urllib.parse
load_dotenv(".env")

NOID_SERVER=os.getenv('NOID_SERVER')
SWIFT_AUTH_URL=os.getenv('SWIFT_AUTH_URL')
SWIFT_USERNAME=os.getenv('SWIFT_USERNAME')
SWIFT_PASSWORD=os.getenv('SWIFT_PASSWORD')
SWIFT_PREAUTH_URL=os.getenv('SWIFT_PREAUTH_URL')
COUCHDB_USER=os.getenv('COUCHDB_USER')
COUCHDB_PASSWORD=os.getenv('COUCHDB_PASSWORD')
COUCHDB_URL=os.getenv('COUCHDB_URL')

image_api_url = 'https://image-tor.canadiana.ca'
presentation_api_url = 'https://crkn-iiif-presentation-api.azurewebsites.net'
conn = swiftclient.Connection(authurl=SWIFT_AUTH_URL,
                              user=SWIFT_USERNAME,
                              key=SWIFT_PASSWORD,
                              preauthurl=SWIFT_PREAUTH_URL)

couch = couchdb.Server('http://'+COUCHDB_USER+':'+COUCHDB_PASSWORD+'@'+COUCHDB_URL+'/')
#db_access = couch['access']
db_canvas = couch['canvas']

def mint_noid(noid_type):
    url = NOID_SERVER + '/mint/1/' + noid_type
    response = requests.post(url)
    response_data = response.json()
    noid_id = response_data['ids'][0]
    return noid_id

def convert_image(source_file, output_path):
    original = Image.open(source_file)
    original.save(output_path, quality=95)
    output = Image.open(output_path)
    return {
        "width": output.width,
        "height": output.height,
        "size": output.size
    }

def save_image_to_swift(swift_filename, container):
    try:
      with open(swift_filename, 'rb') as local_file:
        file_content = local_file.read()
        file_md5_hash = hashlib.md5(file_content).hexdigest()
        conn.put_object(container, swift_filename, contents=file_content)
    except:
        return None
    try:
       conn.get_container(container, prefix=swift_filename)
       return file_md5_hash
    except:
        return None
    
def save_canvas(noid, encoded_noid, width, height, size, md5):
    #canvas = db_canvas.get(canvas['id'])
    db_canvas.save({
        "_id": noid,
        "master": {
          "width": width,
          "extension": "jpg",
          "md5": md5,
          "size": size,
          "height": height,
          "mime": "image/jpeg"
        },
        "source": {
          "from": "IIIF",
          "url": image_api_url+'/iiif/2/'+encoded_noid+'/info.json'
        }
    })

app = FastAPI()

@app.post("/uploadfiles")
async def create_files(files: Annotated[List[bytes], File()]):
    canvases = []
    manifest_noid = mint_noid("manifest")
    for file in files: 
        request_object_content = await file.read()
        source_file = io.BytesIO(request_object_content)
        canvas_noid = mint_noid("canvas")
        encoded_canvas_noid = urllib.parse.quote(canvas_noid)
        swift_filename = canvas_noid + ".jpg" # will handle more than 1 file
        convert_info = convert_image(source_file, swift_filename) 
        swift_md5 = save_image_to_swift(swift_filename, "access-files")
        if swift_md5:
            save_canvas(canvas_noid, encoded_canvas_noid, convert_info['width'], convert_info['height'], convert_info['size'], swift_md5)
            canvases.append({
                "id": presentation_api_url + '/canvas/' + canvas_noid,
                "width": convert_info['width'],
                "height": convert_info['height'],
                "thumbnail": [
                    {
                        "id": image_api_url + '/iiif/2/' + encoded_canvas_noid + '/full/max/0/default.jpg',
                        "type": "Image",
                        "format": "image/jpeg"
                    }
                ],
                "items": [
                    {
                        "id": presentation_api_url + '/' + manifest_noid + '/annotationpage/' + canvas_noid + '/main',
                        "type": "AnnotationPage",
                        "items": [
                            {
                                "id": presentation_api_url + '/' + manifest_noid + '/annotation/' + canvas_noid + '/main/image',
                                "body": {
                                    "id": image_api_url + '/iiif/2/' + encoded_canvas_noid + '/full/max/0/default.jpg',
                                    "type": "Image",
                                    "width": convert_info['width'],
                                    "height": convert_info['height'],
                                    "format": "image/jpeg",
                                    "service": [
                                        {
                                            "id": image_api_url + '/iiif/2/' + encoded_canvas_noid,
                                            "type": "ImageService2",
                                            "profile": "level2"
                                        }
                                    ]
                                },
                                "type": "Annotation",
                                "target": presentation_api_url + '/canvas/' + canvas_noid,
                                "motivation": "painting"
                            }
                        ]
                    }
                ]
            })
    return {"canvases": canvases}


@app.get("/")
async def main():
    content = """
<body>
<form action="/uploadfiles/" enctype="multipart/form-data" method="post">
<input name="files" type="file" multiple>
<input type="submit">
</form>
</body>
    """
    return HTMLResponse(content=content)