import os
import io
import swiftclient
import hashlib
from PIL import Image
from PIL.ExifTags import TAGS
from typing import List
from fastapi import File, FastAPI, Depends, HTTPException, Security, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from typing_extensions import Annotated
import requests
from dotenv import load_dotenv
import os
import couchdb 
#from requests import request
import datetime  # to calculate expiration of the JWT
from fastapi_sso.sso.microsoft import MicrosoftSSO
from fastapi.security import APIKeyCookie  # this is the part that puts the lock icon to the 
from fastapi_sso.sso.base import OpenID
from jose import jwt  # pip install python-jose[cryptography]

# https://stackoverflow.com/questions/45244998/azure-ad-authentication-python-web-api

load_dotenv(".env")
AAD_CLIENT_SECRET=os.getenv('AAD_CLIENT_SECRET')
AAD_CLIENT_ID=os.getenv('AAD_CLIENT_ID')
AAD_TENANT_ID=os.getenv('AAD_TENANT_ID')
AAD_SCOPE_DESCRIPTION=os.getenv('AAD_SCOPE_DESCRIPTION')
AAD_SCOPE_NAME=os.getenv('AAD_SCOPE_NAME')
AAD_TENANT_NAME=os.getenv('AAD_TENANT_NAME')
AAD_AUTH_URL=os.getenv('AAD_AUTH_URL')
AAD_TOKEN_URL=os.getenv('AAD_TOKEN_URL')

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

# TODO - couch openvpn makes request too slow
#couch = couchdb.Server('http://'+COUCHDB_USER+':'+COUCHDB_PASSWORD+'@'+COUCHDB_URL+'/')
#db_access = couch['access']
#db_canvas = couch['canvas']

def mint_noid(noid_type):
    url = NOID_SERVER + '/mint/1/' + noid_type
    response = requests.post(url)
    response_data = response.json()
    noid_id = response_data['ids'][0]
    return noid_id

def convert_image(source_file, output_path):
    original = Image.open(source_file)
    original.save(output_path, quality=80)
    output = Image.open(output_path)
    return {
        "width": output.width,
        "height": output.height,
        "size": output.size
    }

def save_image_to_swift(local_filename, swift_filename, container):
    try:
      with open(local_filename, 'rb') as local_file:
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

'''
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
''' 

sso = MicrosoftSSO(
    client_id=AAD_CLIENT_ID,
    client_secret=AAD_CLIENT_SECRET,
    tenant=AAD_TENANT_ID,
    redirect_uri="http://localhost:8000/auth/callback",
    allow_insecure_http=True,
)

async def get_logged_user(cookie: str = Security(APIKeyCookie(name="token"))) -> OpenID:
    """Get user's JWT stored in cookie 'token', parse it and return the user's OpenID."""
    try:
        claims = jwt.decode(cookie, key=AAD_CLIENT_SECRET, algorithms=["HS256"])
        return OpenID(**claims["pld"])
    except Exception as error:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials") from error


app = FastAPI()

@app.get("/protected")
async def protected_endpoint(user: OpenID = Depends(get_logged_user)):
    """This endpoint will say hello to the logged user.
    If the user is not logged, it will return a 401 error from `get_logged_user`."""
    return {
        "message": f"You are very welcome, {user.email}!",
    }


@app.get("/auth/login")
async def login():
    """Redirect the user to the Google login page."""
    with sso:
        return await sso.get_login_redirect()


@app.get("/auth/logout")
async def logout():
    """Forget the user's session."""
    response = RedirectResponse(url="/")
    response.delete_cookie(key="token")
    return response


@app.get("/auth/callback")
async def login_callback(request: Request):
    """Process login and redirect the user to the protected endpoint."""
    request.timeout = 100000000000000
    with sso:
        openid = await sso.verify_and_process(request)
        if not openid:
            raise HTTPException(status_code=401, detail="Authentication failed")
    # Create a JWT with the user's OpenID
    expiration = datetime.datetime.now(tz=datetime.timezone.utc) + datetime.timedelta(days=1)
    token = jwt.encode({"pld": openid.dict(), "exp": expiration, "sub": openid.id}, key=AAD_CLIENT_SECRET, algorithm="HS256")
    response = RedirectResponse(url="/")
    response.set_cookie(
        key="token", value=token, expires=expiration
    )  # This cookie will make sure /protected knows the user
    return response


@app.post("/uploadfiles")
async def create_files(files: Annotated[List[bytes], File()], user: OpenID = Depends(get_logged_user)):
    canvases = []
    # if form ! have manifest noid min noid else use noid...
    manifest_noid = mint_noid("manifest") 
    for file in files: 
        #request_object_content = await file.read()
        source_file = io.BytesIO(file)
        canvas_noid = mint_noid("canvas")
        encoded_canvas_noid = canvas_noid.replace('/', '%2F')
        swift_filename = canvas_noid + ".jpg" # will handle more than 1 file
        local_filename = encoded_canvas_noid + ".jpg" 
        convert_info = convert_image(source_file, local_filename) 
        swift_md5 = save_image_to_swift(local_filename, swift_filename, "access-files")
        if swift_md5:
            # save_canvas(canvas_noid, encoded_canvas_noid, convert_info['width'], convert_info['height'], convert_info['size'], swift_md5)
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
async def main(cookie: str = Security(APIKeyCookie(name="token"))):
  return {
    "token": cookie,
  }
      

# To send request to mary API:
# https://intility.github.io/fastapi-azure-auth/usage-and-faq/calling_your_apis_from_python

# add route for making manifest:
'''
from fastapi import FastAPI
import httpx
 
app = FastAPI()
 
@app.get("/send-token")
def send_token():
    url = "https://your-backend-api.com/your-endpoint"
    token = "your_token_here"
 
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
 
    data = {
        "key1": "value1",
        "key2": "value2"
    }
 
   
    with httpx.Client() as client:
        response = client.post(url, json=data, headers=headers)
 
    return {
        "status_code": response.status_code,
        "response_body": response.json()
    }


Mary Code:
@router.put("/admin/file",dependencies=[Depends(jwt_auth)])
async def send_manifest(slug:str,
                        request:Request,
                        file:UploadFile = File(...),
                        db:AsyncSession = Depends(async_get_db)
                        ):
   
    message = await upload_manifest_backend(slug,request,file,db)  
    return message 

give mary JWT
'''

''' Example Res:
{
  "canvases": [
    {
      "id": "https://crkn-iiif-presentation-api.azurewebsites.net/canvas/69429/c00r9m628g2v",
      "width": 726,
      "height": 610,
      "thumbnail": [
        {
          "id": "https://image-tor.canadiana.ca/iiif/2/69429%2Fc00r9m628g2v/full/max/0/default.jpg",
          "type": "Image",
          "format": "image/jpeg"
        }
      ],
      "items": [
        {
          "id": "https://crkn-iiif-presentation-api.azurewebsites.net/69429/m09p2w37s979/annotationpage/69429/c00r9m628g2v/main",
          "type": "AnnotationPage",
          "items": [
            {
              "id": "https://crkn-iiif-presentation-api.azurewebsites.net/69429/m09p2w37s979/annotation/69429/c00r9m628g2v/main/image",
              "body": {
                "id": "https://image-tor.canadiana.ca/iiif/2/69429%2Fc00r9m628g2v/full/max/0/default.jpg",
                "type": "Image",
                "width": 726,
                "height": 610,
                "format": "image/jpeg",
                "service": [
                  {
                    "id": "https://image-tor.canadiana.ca/iiif/2/69429%2Fc00r9m628g2v",
                    "type": "ImageService2",
                    "profile": "level2"
                  }
                ]
              },
              "type": "Annotation",
              "target": "https://crkn-iiif-presentation-api.azurewebsites.net/canvas/69429/c00r9m628g2v",
              "motivation": "painting"
            }
          ]
        }
      ]
    }
  ]
}

https://image-tor.canadiana.ca/iiif/2/69429%2Fc0w08wd4n50g/full/max/0/default.jpg
'''