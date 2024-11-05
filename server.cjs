const { app, BrowserWindow, session } = require('electron')
const path = require('path')
const getFolderContentsArray = require('./utilities/getFolderContentsArray.cjs')
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
let AUTH_TOKEN 

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  ipcMain.handle("pushManifestToApis", async (event, data) => {
    let loading = new BrowserWindow()
    loading.loadFile('saving.html')
    console.log(data)
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
      let newMetadata = []
      let slug
      for (let field of data["metadata"]) { 
        console.log(field['label']['en'], fieldsToRemove.includes(field['label']['en'][0]))
        if(!fieldsToRemove.includes(field['label']['en'][0])) {
          newMetadata.push(field)
        }
        if(field['label']['en'] === "Slug") slug = field['value']['en']
      }
      data['metadata'] = newMetadata

      // Check if manifest has noid in id
      const manifestIdSet = data['id'].includes('http')
      let manifestId = null
      if(manifestIdSet) {
        const parsedUrl = new URL(data['id'])
        const pathParts = parsedUrl.pathname.split('/').filter(Boolean)
        console.log("pathParts", pathParts)
        manifestId = `${pathParts[0]}/${pathParts[1]}`
      } else {
        manifestId = `new/new`
      }

      // Send all of the save image requests
      let i = 0
      let canvasIndexArray = []
      for(let canvas of data['items']) {
        loading.webContents.executeJavaScript(`
          document.getElementById('message').innerHTML = 'Saving image ${i+1} of ${data['items'].length}...';
        `)
        // Only save local files
        if(!canvas['id'].includes('http')) {
          const formData  = new FormData()
          const canvasFilePath = data['items'][0]['id'].replace("canvas-", "")
          console.log(canvasFilePath)
          const file = fs.readFileSync(canvasFilePath) 
          const type = mime.lookup(canvasFilePath)
          const fileBlob = new Blob([file], { type: type })
          const fileData = {
            filename: path.basename(canvasFilePath), // Ensure the filename is set
            contentType: 'application/octet-stream' // Optional: Set content type
          }
          formData.append("files", fileBlob, fileData)
          // Send create canvases request - add manifest noid if exists
          const response = await fetch(`http://localhost:8000/uploadfiles/${manifestId}`, {
            method: 'POST',
            body: formData,
            headers: {
              'Authorization': `Bearer ${AUTH_TOKEN}`
            }
          })
          const canvasRes = await response.json()
          console.log(canvasRes)
          if(canvasRes['canvases'].length) {
            let canvas = canvasRes['canvases'][0]
            // If new manifest, set manifest id from response
            if(!manifestIdSet) { 
              const url = canvas['items'][0]['id']
              const urlObj = new URL(url)
              const host = urlObj.host
              const pathname = urlObj.pathname
              const index = pathname.indexOf('annotationpage')
              const modifiedPathname = pathname.slice(0, index)
              data['id'] = 'test'//`${urlObj.protocol}//${host}${modifiedPathname}`
              manifestId = modifiedPathname.replace(/^\/|\/$/g, '')
              console.log("manifest id", manifestId)
            }
            // Replace item in manifest item list...
            //data['items'][i] = canvas
            canvasIndexArray.push(
              {
                index: i,
                canvas
              }
            )
          } else {
            dialog.showErrorBox('Error', `There was a problem saving this image: ${canvasFilePath}`) 
            break
          } 
        }
        i = i + 1
      }

      for(let canvasIndexObj of canvasIndexArray) {
        // Don't replace entire canvas, just merge the 2 objs
        Object.assign(data['items'][canvasIndexObj['index']], canvasIndexObj['canvas'])
      }
      
      // Now attach required files
      data['seeAlso'] = [
        {
          "id": `https://crkn-canadiana-beta.azurewebsites.net/catalog/${slug}/librarian_view`,
          "type": "Dataset",
          "label": {
            "en": [
              "MARC Metadata"
            ]
          },
          "format": "text/xml",
          "profile": "https://www.loc.gov/marc/"
        }
      ]
      data['rendering'] = [
        {
          "id": `http://localhost:8000/pdf/${manifestId}`,
          "type": "Text",
          "label": {
            "en": [
              "PDF version"
            ]
          },
          "format": "application/pdf"
        }
      ]

      loading.webContents.executeJavaScript(`
        document.getElementById('message').innerHTML = 'Saving manifest...';
      `)
      //console.log('manifest', data)
      /*
        TODO: send http://localhost:8000/savemanifest (post, auth token, file json)
      */
      loading.webContents.executeJavaScript(`
        document.getElementById('message').innerHTML = 'Success!';
      `)
    } else {
      // display error popup
      dialog.showErrorBox('Error', result.message) 
    }
    loading.hide()
    loading.close()
    return { result, data }
  })
  
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
  AUTH_TOKEN = store.get('AUTH_TOKEN')
  // TODO - get expiry time and check
  console.log("stored AUTH_TOKEN", AUTH_TOKEN)
  //if(typeof AUTH_TOKEN === "undefined") {
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
            if(cookies.length) {
              console.log(cookies[0].value)
              store.set('AUTH_TOKEN', cookies[0].value)
              authWindow.close()
            }
          }).catch((error) => {
            console.log(error)
          })
    })
    authWindow.on('closed', function() {
      createWindow()
    })
  //} else {
  //  createWindow()
  //}
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})