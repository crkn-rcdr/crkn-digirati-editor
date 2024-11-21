const fs = require('fs')
const mime = require('mime-types')
const path = require('path')
const presentationApiUrl = 'https://crkn-iiif-presentation-api.azurewebsites.net'
const editorApiUrl = 'http://localhost:8000'
const imageApiUrl = 'https://image-tor.canadiana.ca'
let AUTH_TOKEN
const logCachePath = 'C:/Users/BrittnyLapierre/OneDrive - Canadian Research Knowledge Network/Documents/WIP/manifest-editor/new-manifest-log.csv'
// Handle manifest push to APIs
const pushManifest = async (data, loadingWindow, NEW_AUTH_TOKEN) => {
    AUTH_TOKEN = NEW_AUTH_TOKEN

    const originalId = data['id'].includes("https") ? new URL(data['id']).pathname : data['id'] // using to display to user

    data = cleanManifestId(data)
    data = cleanManifestMetadata(data)

    console.log("Check if manifest has a valid ID or generate a new one")
    // Check if manifest has a valid ID or generate a new one
    let manifestId = generateManifestId(data)
    if(manifestId == "new/new") {
        manifestId = await getNewManifestId() //send req to get a manifest ID
    } 
    data['id'] = `${presentationApiUrl}/manifest/${manifestId}`

    let slug
    for (let field of data["metadata"]) { 
      if('en' in field['label'] && 'en' in field['value'] ) {
        if(field['label']['en'][0] === "Slug") {
          slug = field['value']['en'][0]
        }
      }
    }
    console.log("Handle saving images")
    // Handle saving images
    await saveImagesToCanvas(data, loadingWindow, manifestId, originalId)

    console.log("Attach required files to manifest")
    // Attach required files to manifest
    attachRequiredFiles(data, manifestId, slug)

    console.log("Save the manifest to the API")
    fs.writeFileSync("manifest.json", JSON.stringify(data))
    // Save the manifest to the API
    await saveManifestToAPI(data, manifestId, loadingWindow, originalId, slug)

    return data
}
  
// Format the ID for the API
const cleanManifestId = (data) => {
    if(data['id'].includes("http")) return data
    data['id'] = `${presentationApiUrl}/manifest/new/new`
    return data
}
  
// Clean up metadata by removing unnecessary fields
const cleanManifestMetadata = (data) => {
    let fieldsToRemove = [ 
      "InMagic Identifier",
      "CIHM Identifier",
      "Alternate Title", //(must be the second title column in the record)
      "Volume/Issue", //(we concatenate this field with the main title field)
      "Issue Date",
      "Coverage Date",
      "Language",
      "Place of Publication",
      "Publisher",
      "Publication Date",
      "Source"
    ]
    let newMetadata = []
    for (let field of data["metadata"]) { 
      if('en' in field['label'] && 'en' in field['value'] ) {
        if(!fieldsToRemove.includes(field['label']['en'][0])) {
          newMetadata.push(field)
        }
      }
    }
    console.log("newMetadata", JSON.stringify(newMetadata))
    data['metadata'] = newMetadata
    return data
}
  
// Generate a manifest ID
const generateManifestId = (data) => {
    let manifestId
    const manifestIdSet = data.id.includes(presentationApiUrl)
    console.log("data.id", data.id)
    if (manifestIdSet) {
      const regex = /\/([^\/]+\/[^\/]+)$/;
      const match = data.id.match(regex);
      if (match) {
        manifestId = match[1]
      } else {
        manifestId = 'new/new'
      }
    } else {
      manifestId = 'new/new'
    }
  
    return manifestId
}
  
function extractCanvasNoid(url) {
    // Define the regex pattern to extract the portion after "/iiif/2/"
    const pattern = /\/iiif\/2\/([^\/]+%2F[^\/]+)/
    // Use regex to extract the portion
    const match = url.match(pattern);
    if (match) {
      // Extract the portion and replace %2F with /
      const extractedPortion = match[1]
      const modifiedPortion = extractedPortion.replace('%2F', '/')
      // Return the modified portion (e.g., "69429/c07p8tb10n4j")
      return modifiedPortion;
    } else {
      throw "Error getting canvas id"
    }
}
  
// Save images to canvas
const saveImagesToCanvas = async (data, loadingWindow, manifestId, originalId) => {
    let canvasIndexArray = []
    for (let i = 0; i < data.items.length; i++) {
      loadingWindow.webContents.executeJavaScript(`
        document.getElementById('title').innerHTML = 'Pushing Manifest: ${originalId}';
        document.getElementById('message').innerHTML = 'While you wait, feel free to go back to the main menu and work on another manifest.<br/>Saving image ${i + 1} of ${data.items.length}...';
      `)

      // Only add local files and non-crkn images to swift - or if old manifest url just format
      let canvasRes
      if(!data.items[i].items[0].items[0].body.id.includes('http')) { // If a image on the user's computer
        const canvasFilePath = data.items[i].items[0].items[0].body.id
        const formData = createFormDataFromFile(canvasFilePath)
        console.log(formData)
        const response = await fetch(`${editorApiUrl}/uploadfiles/${manifestId}`, {
          method: 'POST',
          body: formData,
          headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
        })
        canvasRes = await response.json()
      } 
      else if(!data.items[i].items[0].items[0].body.id.includes(imageApiUrl)){ // If external non-crkn image
        console.log({
          urls : [data.items[i].items[0].items[0].body.id]
        })
        const response = await fetch(`${editorApiUrl}/createfilesfromurl/${manifestId}`, {
          method: 'POST',
          body: JSON.stringify({
            urls : [data.items[i].items[0].items[0].body.id]
          }),
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json'
          }
        })
        canvasRes = await response.json()
      } else if (!data.items[i].id.includes(presentationApiUrl)) {  // If existing CRKN image but not new API canvas
        // No need to upload, just configure for the new API format
        const canvasNoid = extractCanvasNoid(data.items[i].items[0].items[0].body.id)
        const encodedCanvasNoid = canvasNoid.replace("/", "%2F")
        const width = data.items[i].width
        const height = data.items[i].height
        canvasRes = { canvases : [{
          "id": `${presentationApiUrl}/canvas/${canvasNoid}`,
          "width": width,
          "height": height,
          "thumbnail": [{
            "id": `${imageApiUrl}/iiif/2/${encodedCanvasNoid}/full/max/0/default.jpg`,
            "type": "Image",
            "format": "image/jpeg"
          }],
          "items": [{
            "id": `${presentationApiUrl}/${manifestId}/annotationpage/${canvasNoid}/main`,
            "type": "AnnotationPage",
            "items": [{
              "id": `${presentationApiUrl}/${manifestId}/annotation/${canvasNoid}/main/image`,
              "body": {
                "id": `${imageApiUrl}/iiif/2/${encodedCanvasNoid}/full/max/0/default.jpg`,
                "type": "Image",
                "width": width,
                "height": height,
                "format": "image/jpeg",
                "service": [{
                  "id": `${imageApiUrl}/iiif/2/${encodedCanvasNoid}`,
                  "type": "ImageService2",
                  "profile": "level2"
                }]
              },
              "type": "Annotation",
              "target": `${presentationApiUrl}/canvas/${canvasNoid}`,
              "motivation": "painting"
            }]
          }],
          "seeAlso": [{
            "id": `${editorApiUrl}/ocr/${canvasNoid}`,
            "type": "Dataset",
            "label": {"en": ["Optical Character Recognition text in XML"]},
            "format": "text/xml",
            "profile": "http://www.loc.gov/standards/alto"
          }],
          "rendering": [{
            "id": `${editorApiUrl}/pdf/${canvasNoid}`,
            "type": "Text",
            "label": {"en": ["PDF version"]},
            "format": "application/pdf"
          }]
        }]}
      }
      if (canvasRes) { // if defined, we did something to a canvas
        if (canvasRes.canvases?.length) {
          let canvas = canvasRes.canvases[0]
          console.log("canvas", canvas)
          data.items[i] = formatAnnotations(data.items[i], canvas["id"])
          canvasIndexArray.push({ index: i, canvas })
        } else {
          throw new Error(`Could not save canvas: ${data.items[i].id}`)
        }
      }
    }
    // Merge any changed canvases into canvas in manifest data
    for (let canvasIndexObj of canvasIndexArray) {
      Object.assign(data.items[canvasIndexObj.index], canvasIndexObj.canvas)
    }
    return manifestId
}

const extractAnnotationId = (originalId) => {
  // Regular expression to match /annotations/<alphanumeric_string>
  const regex = /\/annotations\/[a-zA-Z0-9\-]+.*/;
  const match = originalId.match(regex);
  
  if (match) {
      return match[0]; // Return the matched string
  } else {
      return null; // If no match found
  }
}

const extractXYWH = (inputString) => {
  // Regular expression to match #xywh=<four numbers separated by commas>
  const regex = /#xywh=\d+,\d+,\d+,\d+/;
  const match = inputString.match(regex);
  
  if (match) {
      return match[0]; // Return the matched string
  } else {
      return null; // If no match found
  }
}

const formatAnnotations = (localCanvas, remoteCanvasId) => {
  if("annotations" in localCanvas) {
    for(let annotationPage of localCanvas["annotations"]) {
      const annotationPageId = extractAnnotationId(annotationPage["id"])
      annotationPage["id"] = `${remoteCanvasId}${annotationPageId}` 
      console.log("new id: ", annotationPage["id"])
      for(let annotation of annotationPage["items"]) {
        const annotationId = extractAnnotationId(annotation["id"])
        annotation["id"] = `${remoteCanvasId}${annotationId}` 
        const targetPosition = extractXYWH(annotation["target"])
        annotation["target"] = `${remoteCanvasId}${targetPosition}` 
        //annotation["body"]['id'] = `${remoteCanvasId}${annotationId}/body` 
        delete annotation["body"]['id'] // bug fix - TODO - if fixed in editor, remove line
      }
    }
  }
  return localCanvas
  /*
    "annotations": [
      {
        "id": "canvas-C:/Users/BrittnyLapierre/OneDrive - Canadian Research Knowledge Network/Documents/WIP/newspaper/oocihm.N_00127_18760105/0001.jpg/annotations/cetlls58mie-m3rcqsth",
        "type": "AnnotationPage",
        "items": [
          {
            "id": "canvas-C:/Users/BrittnyLapierre/OneDrive - Canadian Research Knowledge Network/Documents/WIP/newspaper/oocihm.N_00127_18760105/0001.jpg/annotations/cetlls58mie-m3rcqsth/annotation/mes71sw1kpr-m3rcqznd",
            "type": "Annotation",
            "motivation": "describing",
            "target": "canvas-C:/Users/BrittnyLapierre/OneDrive - Canadian Research Knowledge Network/Documents/WIP/newspaper/oocihm.N_00127_18760105/0001.jpg#xywh=2335,1821,934,596",
            "body": {
              "id": "canvas-C:/Users/BrittnyLapierre/OneDrive - Canadian Research Knowledge Network/Documents/WIP/newspaper/oocihm.N_00127_18760105/0001.jpg/annotations/cetlls58mie-m3rcqsth/annotation/mes71sw1kpr-m3rcqznd/html/en/6ycudwaj9v3-m3rcqznd",
              "type": "TextualBody",
              "format": "text/html",
              "language": "en",
              "value": "number"
            }
          }
        ]
      }
    ]
  */
}
  
const getNewManifestId = async () => {
    const response = await fetch(`${editorApiUrl}/newid`)
    const obj = await response.json()
    return obj.id
}
  
// Create FormData from folder for the file upload
const createFormDataFromFile = (canvasFilePath) => {
    const file = fs.readFileSync(canvasFilePath)
    const type = mime.lookup(canvasFilePath)
    console.log(file, canvasFilePath, type)
    const fileBlob = new Blob([file], { type })
    const formData = new FormData()
    formData.append("files", fileBlob, {
      filename: path.basename(canvasFilePath),
      contentType: 'application/octet-stream'
    })
    return formData
}
  
// Attach required files to the manifest
const attachRequiredFiles = (data, manifestId, slug) => {
    data.seeAlso = [{
      id: `https://crkn-canadiana-beta.azurewebsites.net/catalog/${slug}/librarian_view`,
      type: "Dataset",
      label: { en: ["MARC Metadata"] },
      format: "text/xml",
      profile: "https://www.loc.gov/marc/"
    }]
    data.rendering = [{
      id: `${editorApiUrl}/pdf/${manifestId}`,
      type: "Text",
      label: { en: ["PDF version"] },
      format: "application/pdf"
    }]
}
  
// Save the manifest to the API
const saveManifestToAPI = async (data, manifestId, loadingWindow, originalId, slug) => {
    loadingWindow.webContents.executeJavaScript(`
        document.getElementById('message').innerHTML = 'While you wait, feel free to go back to the main window and work on another manifest.<br/>Saving manifest...';
    `)
    const response = await fetch(`${editorApiUrl}/savemanifest/${manifestId}`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    })
    const manifestRes = await response.json()
    if (manifestRes.success) {
        loadingWindow.webContents.executeJavaScript(`
            document.getElementById('title').innerHTML = '${originalId} - Success';
            document.getElementById('message').innerHTML = ' Your manifest has been saved to the API. You can now access it using the following url: ${presentationApiUrl}/manifest/${manifestId} But for now, you must run the legacy access script on the VM to add this object to CAP.';
        `)
        //if(!originalId.includes(manifestId)) {
          // Write To Manifest Creation Log CSV
          if(!fs.existsSync(logCachePath)) {
            let content = "Slug,URL\n"
            fs.writeFileSync(logCachePath, content , "utf-8")
          }
          let rowString = `${slug},${presentationApiUrl}/manifest/${manifestId}\n`
          let dcCache = fs.readFileSync(logCachePath, 'utf-8')
          fs.writeFileSync(logCachePath , dcCache + rowString, "utf-8")
        //}
    } else {
        loadingWindow.webContents.executeJavaScript(`
            document.getElementById('title').innerHTML = '${originalId} - Error';
            document.getElementById('message').innerHTML = '${manifestRes.message}';
        `)
    }
}
module.exports = {
    pushManifest
}