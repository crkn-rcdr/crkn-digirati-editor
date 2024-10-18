const { app, BrowserWindow } = require('electron')
const path = require('path')
const getFolderContentsArray = require('./utilities/getFolderContentsArray.cjs')
const legacyIngestTrigger = require('./utilities/legacyIngestTrigger.cjs')
const { ipcMain, dialog } = require("electron")
const fs = require('fs')
const { getManifest, getManifestItems } = require("./utilities/manifestCreation.cjs")
const writeDcCsv = require("./utilities/writeDcCsv.cjs")
const Store = require('electron-store')
const axios = require('axios')

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

      // TODO: send to IIIF API - get response, add SeeAlso for marc metadata, and resend

      //canvas-C:/Users/BrittnyLapierre/OneDrive - Canadian Research Knowledge Network/Documents/WIP/project/step 2/0001.jpg
      
      // check if manifest has noid in id
      const formData  = new FormData()
      let indexesOfItemsToCreate = []
      let i = 0
      // For each canvas
      //     if not crkn url
      //        form data append file blob
      //        indexesOfItemsToCreate.append(i)
      //     i++
      let canvasFile = data['items'][0]['id'].replace("canvas-", "")
      console.log(canvasFile)
      const fileData = fs.readFileSync(canvasFile)
      console.log(fileData)
      const blob = new Blob([fileData])
      formData.append("file", blob, path.basename(canvasFile) )
      // send create canvases request - add manifest noid if exists
      
      console.log(formData)
      const response = await fetch("http://127.0.0.1:8000/createCanvas", {
        method: 'POST',
        body: formData,
      })

      if(response.length) {
        i = 0
        if(!data['id'].includes('http')) { // set manifest id from response if no manifest id not already created
          const url = response[0]['items'][0]['id']
          const urlObj = new URL(url)
          const host = urlObj.host
          const pathname = urlObj.pathname
          const index = pathname.indexOf('annotationpage')
          const modifiedPathname = pathname.slice(0, index)
          data['id'] = `${urlObj.protocol}//${host}${modifiedPathname}`
        }

        // replace items in item list...
        // for canvas in response
        //   manifest['items'][indexesOfItemsToCreate[i]] = canvas
        //   i++
      }
      
      // compile legacy manifest
      // send request to upsert legacy manifest into couch
      // note: any deleted canvases will be dangling... will want cleanup cron job

      // send request to mary API for migrating manifest
      // see: https://crkn-iiif-presentation-api.azurewebsites.net/docs#/Manifest/update_manifest_file_put
      //      https://github.com/crkn-rcdr/crkn-IIIF-presentation-api/blob/4f8c2f599a304258d4feb197fc6432825c761559/utils/upload_manifest.py#L87


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
    // Use the access platform app for auth
    const store = new Store()
    let AUTH_TOKEN = store.get('AUTH_TOKEN')
    console.log("stored AUTH_TOKEN", AUTH_TOKEN)
    if(typeof AUTH_TOKEN === "undefined") {
      var authWindow = new BrowserWindow({
        width: 800, 
        height: 600, 
        show: false, 
        'node-integration': false,
        'web-security': false
      })
      var authUrl = 'https://access.canadiana.ca'
      authWindow.loadURL(authUrl);
      authWindow.show()
      authWindow.webContents.on('did-navigate-in-page', (cookie) => {
        const ses = authWindow.webContents.session
        ses.cookies.get({name:"auth_token"})
          .then((cookies) => {
            if(cookies.length) {
              AUTH_TOKEN = cookies[0].value
              store.set('AUTH_TOKEN', AUTH_TOKEN)
            }
            console.log("AUTH_TOKEN", AUTH_TOKEN)
            // TODO: close window
          }).catch((error) => {
              console.log(error)
          })
      })
      authWindow.on('closed', function() {
        authWindow = null
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