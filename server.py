import os
import io
import swiftclient
import hashlib
from PIL import Image
from PIL.ExifTags import TAGS
from typing import List
from fastapi import FastAPI, File, Security, Depends
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi_azure_auth import SingleTenantAzureAuthorizationCodeBearer
from pydantic import AnyHttpUrl, computed_field
from typing_extensions import Annotated
import requests
from dotenv import load_dotenv
import os
import couchdb 
from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi_azure_auth.user import User



load_dotenv(".env")
APP_CLIENT_ID=os.getenv('APP_CLIENT_ID')
TENANT_ID=os.getenv('TENANT_ID')
OPENAPI_CLIENT_ID=os.getenv('OPENAPI_CLIENT_ID')
SCOPE_DESCRIPTION = os.getenv("SCOPE_DESCRIPTION")
SCOPE_NAME = os.getenv("SCOPE_NAME")
NOID_SERVER=os.getenv('NOID_SERVER')
SWIFT_AUTH_URL=os.getenv('SWIFT_AUTH_URL')
SWIFT_USERNAME=os.getenv('SWIFT_USERNAME')
SWIFT_PASSWORD=os.getenv('SWIFT_PASSWORD')
SWIFT_PREAUTH_URL=os.getenv('SWIFT_PREAUTH_URL')
COUCHDB_USER=os.getenv('COUCHDB_USER')
COUCHDB_PASSWORD=os.getenv('COUCHDB_PASSWORD')
COUCHDB_URL=os.getenv('COUCHDB_URL')

class Settings(BaseSettings):
    BACKEND_CORS_ORIGINS: list[str] = ['http://localhost:8000']
    OPENAPI_CLIENT_ID: str = OPENAPI_CLIENT_ID
    APP_CLIENT_ID: str = APP_CLIENT_ID
    TENANT_ID: str = TENANT_ID
    SCOPE_DESCRIPTION: str = SCOPE_DESCRIPTION

    @computed_field
    @property
    def SCOPE_NAME(self) -> str:
        return f'api://{self.APP_CLIENT_ID}/{self.SCOPE_DESCRIPTION}'

    @computed_field
    @property
    def SCOPES(self) -> dict:
        return {
            self.SCOPE_NAME: self.SCOPE_DESCRIPTION,
        }
    class Config:
        env_file = '.env'
        env_file_encoding = 'utf-8'
        case_sensitive = True

settings = Settings()

app = FastAPI( swagger_ui_oauth2_redirect_url='/oauth2-redirect',
    swagger_ui_init_oauth={
        'usePkceWithAuthorizationCodeGrant': True,
        'clientId': settings.OPENAPI_CLIENT_ID,
        'scopes': SCOPE_NAME,
    }
)

if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )

azure_scheme = SingleTenantAzureAuthorizationCodeBearer(
    app_client_id=settings.APP_CLIENT_ID,
    tenant_id=settings.TENANT_ID,
    scopes=settings.SCOPES,
)

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

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Load OpenID config on startup.
    """
    await azure_scheme.openid_config.load_config()
    yield

@app.post("/uploadfiles") #, dependencies=[Security(azure_scheme)]
async def create_files(files: Annotated[List[bytes], File()]):
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

@router.get(
    '/hello-user',
    response_model=User,
    operation_id='helloWorldApiKey',
)
async def hello_user(user: User = Depends(azure_scheme)) -> dict[str, bool]:
    """
    Wonder how this auth is done?
    """
    return user.dict()

@app.get("/", dependencies=[Security(azure_scheme)])
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

# Add api azure auth
# https://intility.github.io/fastapi-azure-auth/single-tenant/fastapi_configuration/

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