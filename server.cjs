const { app, BrowserWindow, session } = require('electron')
const path = require('path')
const getFolderContentsArray = require('./utilities/getFolderContentsArray.cjs')
const legacyIngestTrigger = require('./utilities/legacyIngestTrigger.cjs')
const { ipcMain, dialog } = require("electron")
const fs = require('fs')
const { getManifest, getManifestItems } = require("./utilities/manifestCreation.cjs")
const writeDcCsv = require("./utilities/writeDcCsv.cjs")
const Store = require('electron-store')
const mime = require('mime-types')

//const { fork } = require('child_process')
//const ps = fork(`${__dirname}/fileServer.cjs`)
//console.log("Fileserver running in the bg: ", ps)
/*
const { download } = import('electron-dl')
*/
const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  ipcMain.handle("triggerLegacyIngest", async (event, slug) => {
    let response = await legacyIngestTrigger(slug, AUTH_TOKEN)
    console.log(response)
    return response.status == 200
  })

  ipcMain.handle("pushManifestToApis", async (event, data) => {
    let result = writeDcCsv(data)
    console.log(result)
    if (result.success) {
      // remove fields from manifest
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

      let slug = ''
      let newMetadata = []
      for (let field of data["metadata"]) { 
        console.log(field['label']['en'], fieldsToRemove.includes(field['label']['en'][0]))
        if(!fieldsToRemove.includes(field['label']['en'][0])) {
          newMetadata.push(field)
        }
        if(field['label']['en'] === "Slug") slug = field['value']['en']
      }
      data['metadata'] = newMetadata

      
      const formData  = new FormData()
      // check if manifest has noid in id
      const manifestIdSet = data['id'].includes('http')
      if(manifestIdSet) {
        const parsedUrl = new URL(data['id'])
        const pathParts = parsedUrl.pathname.split('/').filter(Boolean)
        //formData.append("manifest_id", `${pathParts[0]}/${pathParts[1]}`)
      } else {
        //formData.append("manifest_id", null)
      }

      let indexesOfItemsToCreate = []
      let i = 0
      // For each canvas
      //     if not crkn url - id must include: "https://crkn-iiif-presentation-api.azurewebsites.net/canvas"
      //        form data append file blob
      //        indexesOfItemsToCreate.push(i)
      //     i++
      // Case for local files:
      let canvasFile = data['items'][0]['id'].replace("canvas-", "")
      console.log(canvasFile)
      const file = fs.readFileSync(canvasFile) 
      const type = mime.lookup(canvasFile)
      const fileBlob = new Blob([file], { type: type })
      const fileData = {
        filename: path.basename(canvasFile), // Ensure the filename is set
        contentType: 'application/octet-stream' // Optional: Set content type
      }
      formData.append("files", fileBlob, fileData)
  
      // case for external http files:
      // todo

      // send create canvases request - add manifest noid if exists
      const response = await fetch("http://127.0.0.1:80/uploadfiles", {
        method: 'POST',
        body: formData
      })
      const canvases = await response.json()
      console.log(JSON.stringify(canvases))
      if(canvases.length) {
        i = 0
        if(!manifestIdSet) { // set manifest id from response if no manifest id not already created
          const url = canvases[0]['items'][0]['id']
          const urlObj = new URL(url)
          const host = urlObj.host
          const pathname = urlObj.pathname
          const index = pathname.indexOf('annotationpage')
          const modifiedPathname = pathname.slice(0, index)
          data['id'] = `${urlObj.protocol}//${host}${modifiedPathname}`
          console.log("manifest id", data['id'] )
        }

        // replace items in item list...
        // for canvas in response
        //   manifest['items'][indexesOfItemsToCreate[i]] = canvas
        //   i++
      }
      
      // through backend, send request to mary API for create manifest
      
      console.log(response)
    } else {
      // display error popup
      dialog.showErrorBox('Error', result.message) 
    }
    return { result, data }
  })
  
  ipcMain.handle("writeManifestToFileSystem", async (event, data) => {
    const folderPath = path.dirname(data['items'][0]['id'].replace("canvas-", ''))
    const projectPath = path.dirname(folderPath)
    const pathToSaveTo = path.join(projectPath,'.manifest.json')
    // Handle any image re-ordering. 
    // 1. Rename source images while handling duplicates.
    let i = 0
    for(let item of data['items']) { 
      const fileName = item['id'].replace("canvas-", '')
      const ext = path.extname(fileName)
      const newFileName = path.join( path.dirname(fileName), "tmp."+(i+1).toString().padStart(4, '0')+ext )
      fs.renameSync( fileName, newFileName )
      i++
    }
    let files = getFolderContentsArray(folderPath) 
    i = 0
    for(let filePath of files) { 
      const newFileName = filePath.replace("tmp.", '')
      fs.renameSync( filePath, newFileName )
      i++
    }
    //Note: Openseadragon seems to be caching the image source data, so I reload the page on the client side.
    files = getFolderContentsArray(folderPath) 
    data['items'] = getManifestItems(files)
    //Write
    fs.writeFileSync(pathToSaveTo, JSON.stringify(data), 'utf-8') 
    return data
  })

  ipcMain.handle("readManifestFromFileSystem", async (event) => {
    const handler = await dialog.showOpenDialog({properties: ['openDirectory']})
    if(!handler.filePaths[0]) return
    const folderPath = handler.filePaths[0].replace(/\\/g, '/')
    // Check if save file exists
    const manifestCache = path.join(path.dirname(folderPath),'.manifest.json')
    if(fs.existsSync(manifestCache)) {
      manifest = JSON.parse(fs.readFileSync(manifestCache, 'utf-8'))
    }
    return getManifest(folderPath)
  })

  // Not used right now.
  ipcMain.handle("createManifestFromFolder", async (event) => {
    const handler = await dialog.showOpenDialog({properties: ['openDirectory']})
    if(!handler.filePaths[0]) return
    const folderPath = handler.filePaths[0].replace(/\\/g, '/')
    return getManifest(folderPath, null)
  })

  win.loadFile( path.join(__dirname, '/dist/index.html') )
}

app.whenReady().then(() => {
  // Calls the back end to authenticate
  const store = new Store()
  let AUTH_TOKEN = store.get('AUTH_TOKEN')
  // TODO - get expiry time and check
  console.log("stored AUTH_TOKEN", AUTH_TOKEN)
  if(typeof AUTH_TOKEN === "undefined") {
    const authWindow = new BrowserWindow({
      webPreferences: {
          nodeIntegration: false,
      }
    })
    const url = new URL("http://localhost:8000/auth/login")
    authWindow.loadURL(url.toString())
    authWindow.webContents.on(
      'did-redirect-navigation',
      function() {
        console.log("calling")
        session.defaultSession.cookies.get({ name : 'token'})
          .then((cookies) => {
            console.log(cookies[0].value)
            store.set('AUTH_TOKEN', cookies[0].value)
            //store.set('AUTH_TOKEN_EXPIRE', timestamp)
            authWindow.close()
          }).catch((error) => {
            console.log(error)
          })
    })
    authWindow.on('closed', function() {
      createWindow()
    })
  } else {
    createWindow()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})