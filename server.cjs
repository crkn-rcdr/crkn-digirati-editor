const { app, BrowserWindow, session, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const mime = require('mime-types')
const Store = require('electron-store')
const { getManifest, getManifestItems } = require("./utilities/manifestCreation.cjs")
const writeDcCsv = require("./utilities/writeDcCsv.cjs")

// Global variable for auth token
let AUTH_TOKEN

// Create the main application window
const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  ipcMain.handle("pushManifestToApis", handlePushManifest)
  ipcMain.handle("createManifestFromFolder", handleCreateManifestFromFolder)

  win.loadFile(path.join(__dirname, '/dist/index.html'))
}

// Handle manifest push to APIs
const handlePushManifest = async (event, data) => {
  console.log(data)
  let loading = new BrowserWindow()
  loading.loadFile('saving.html')
  
  // Writing DC CSV and checking result
  let result = writeDcCsv(data)
  console.log(result)
  
  if (result.success) {
    data = cleanManifestId(data)
    console.log(data)
    data = cleanManifestMetadata(data)
    
    console.log("Check if manifest has a valid ID or generate a new one")
    // Check if manifest has a valid ID or generate a new one
    let manifestId = generateManifestId(data)

    console.log("Handle saving images")
    // Handle saving images
    const newManifestId = await saveImagesToCanvas(data, loading, manifestId)
    if(manifestId == "new/new") manifestId = newManifestId
    data['id'] = `http://crkn-iiif-presentation-api.azurewebsites.net/manifest/${manifestId}`

    console.log("Attach required files to manifest")
    // Attach required files to manifest
    attachRequiredFiles(data, manifestId)

    console.log("Save the manifest to the API")
    // Save the manifest to the API
    await saveManifestToAPI(data, manifestId, loading)

  } else {
    dialog.showErrorBox('Error', result.message)
  }

  return { result, data }
}

// Format the ID for the API
const cleanManifestId = (data) => {
  if(data['id'].includes("http")) return data
  data['id'] = "http://crkn-iiif-presentation-api.azurewebsites.net/manifest/new/new"
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
  const manifestIdSet = data.id.includes('https://crkn-iiif-presentation-api.azurewebsites.net')
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

// Save images to canvas
const saveImagesToCanvas = async (data, loading, manifestId) => {
  let canvasIndexArray = []
  for (let i = 0; i < data.items.length; i++) {
    // Only process local files and non-crkn images
    if (!data.items[i].id.includes('https://crkn-iiif-presentation-api.azurewebsites.net')) {
      loading.webContents.executeJavaScript(`
        document.getElementById('message').innerHTML = 'Saving image ${i + 1} of ${data.items.length}...';
      `)
      let canvasRes
      if(!data.items[i].id.includes('http')) {
        const canvasFilePath = data.items[i].id.replace("canvas-", "")
        const formData = createFormDataFromFile(canvasFilePath)
        console.log(formData)
        const response = await fetch(`http://localhost:8000/uploadfiles/${manifestId}`, {
          method: 'POST',
          body: formData,
          headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
        })
        canvasRes = await response.json()
      } 
      else if(!data.items[i].items[0].items[0].body.id.includes("https://image-tor.canadiana.ca")){
        console.log({
          urls : [data.items[i].items[0].items[0].body.id]
        })
        //{"detail":"Invalid token: Signature verification failed"}
        const response = await fetch(`http://localhost:8000/createfilesfromurl/${manifestId}`, {
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
      }
      if (canvasRes?.canvases?.length) {
        const canvas = canvasRes.canvases[0]
        canvasIndexArray.push({ index: i, canvas })
        // Check if manifest has a valid ID or generate a new one
        if(manifestId == "new/new") {
          const url = canvas['items'][0]['id']
          const urlObj = new URL(url)
          const host = urlObj.host
          const pathname = urlObj.pathname
          const index = pathname.indexOf('/annotationpage')
          const modifiedPathname = pathname.slice(0, index)
          data['id'] = `${urlObj.protocol}//${host}${modifiedPathname}`
          manifestId = modifiedPathname.replace(/^\/|\/$/g, '')
          console.log("manifest id", manifestId)
        }
      } 
    } 
  }
  // Merge any changed canvases into canvas in manifest data
  for (let canvasIndexObj of canvasIndexArray) {
    Object.assign(data.items[canvasIndexObj.index], canvasIndexObj.canvas)
  }
  return manifestId
}

// Create FormData from folder for the file upload
const createFormDataFromFile = (canvasFilePath) => {
  const file = fs.readFileSync(canvasFilePath)
  const type = mime.lookup(canvasFilePath)
  const fileBlob = new Blob([file], { type })
  const formData = new FormData()
  formData.append("files", fileBlob, {
    filename: path.basename(canvasFilePath),
    contentType: 'application/octet-stream'
  })
  return formData
}

// Attach required files to the manifest
const attachRequiredFiles = (data, manifestId) => {
  let slug
  for (let field of data["metadata"]) { 
    if('en' in field['label'] && 'en' in field['value'] ) {
      if(field['label']['en'][0] === "Slug") {
        slug = field['value']['en'][0]
      }
    }
  }
  data.seeAlso = [{
    id: `https://crkn-canadiana-beta.azurewebsites.net/catalog/${slug}/librarian_view`,
    type: "Dataset",
    label: { en: ["MARC Metadata"] },
    format: "text/xml",
    profile: "https://www.loc.gov/marc/"
  }]

  data.rendering = [{
    id: `http://localhost:8000/pdf/${manifestId}`,
    type: "Text",
    label: { en: ["PDF version"] },
    format: "application/pdf"
  }]
}

// Save the manifest to the API
const saveManifestToAPI = async (data, manifestId, loading) => {
  loading.webContents.executeJavaScript(`
    document.getElementById('message').innerHTML = 'Saving manifest...';
  `)
  const response = await fetch(`http://localhost:8000/savemanifest/${manifestId}`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
  })
  const manifestRes = await response.json()
  if (manifestRes.success) {
    loading.webContents.executeJavaScript(`
      document.getElementById('title').innerHTML = 'Success';
      document.getElementById('message').innerHTML = 'Your manifest has been saved to the API.';
    `)
  } else {
    loading.webContents.executeJavaScript(`
      document.getElementById('title').innerHTML = 'Error';
      document.getElementById('message').innerHTML = '${manifestRes.message}';
    `)
  }
}

// Handle creation of manifest from folder
const handleCreateManifestFromFolder = async () => {
  const handler = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  if (!handler.filePaths[0]) return
  const folderPath = handler.filePaths[0].replace(/\\/g, '/')
  return getManifest(folderPath, null)
}

// Initialize the app
app.whenReady().then(() => {
  const store = new Store()
  AUTH_TOKEN = store.get('AUTH_TOKEN')
  //if (!AUTH_TOKEN) {
  const authWindow = new BrowserWindow({ webPreferences: { nodeIntegration: false } })
  const url = new URL("http://localhost:8000/auth/login")
  authWindow.loadURL(url.toString())

  authWindow.webContents.on('did-redirect-navigation', () => {
    session.defaultSession.cookies.get({ name: 'token' })
      .then(cookies => {
        if (cookies.length) {
          store.set('AUTH_TOKEN', cookies[0].value)
          authWindow.close()
        }
      }).catch(console.error)
  })

  authWindow.on('closed', createWindow)
  /*} else {
    createWindow()
  }*/
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
