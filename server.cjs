const { app, BrowserWindow } = require('electron')
const path = require('path')
const getFolderContentsArray = require('./utilities/getFolderContentsArray.cjs')
const { ipcMain, dialog } = require("electron")
const fs = require('fs')
const { getManifest, getManifestItems } = require("./utilities/manifestCreation.cjs")
const writeDcCsv = require("./utilities/writeDcCsv.cjs")
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
      let newMetadata = []
      for (let field of data["metadata"]) { 
        console.log(field['label']['en'], fieldsToRemove.includes(field['label']['en'][0]))
        if(!fieldsToRemove.includes(field['label']['en'][0])) {
          newMetadata.push(field)
        }
      }
      data['metadata'] = newMetadata
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
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})