const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const writeDcCsv = require("./utilities/writeDcCsv.cjs")
const { createManifest, replaceManifestCanvasesFromFolder } = require("./utilities/manifestCreation.cjs")
const Store = require('electron-store')
const fs = require('fs')
const store = new Store()
const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  ipcMain.handle('replaceManifestCanvasesFromFolder', handleReplaceManifestCanvasesFromFolder)
  ipcMain.handle("createManifestFromFolder", handleCreateManifestFromFolder)
  ipcMain.handle('openFile', handleOpenFile)
  ipcMain.handle('setWipPath', handleSetWipPath)
  ipcMain.handle('getWipPath', handleGetWipPath)
  ipcMain.handle('setMetadataProfile', handleSetMetadataProfile)
  ipcMain.handle('getMetadataProfile', handleGetMetadataProfile)
  ipcMain.handle('extractDc', handleExtractDc)
  ipcMain.handle('relabelCanveses', handleRelabelCanveses)
  ipcMain.handle('saveManifest', handleSaveManifest)
  win.loadFile(path.join(__dirname, '/dist/index.html'))
}
const handleSetWipPath = async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  })
  if (!result.canceled && result.filePaths.length > 0) {
    const folderPath = result.filePaths[0].replace("\\", "/")
    store.set('wipPath', folderPath)
    return folderPath
  }
  return await handleGetWipPath()
}
const handleGetWipPath = async () => {
  const wipPath = store.get('wipPath')
  return wipPath || 'No WIP folder set.'
}
const handleSetMetadataProfile = async (event, data) => {
  const metadataArray = JSON.stringify(data["metadata"] ? data["metadata"] : [])
  store.set('metadataProfile', metadataArray)
  return await handleGetWipPath()
}
const handleGetMetadataProfile = async () => {
  const metadataString = store.get('metadataProfile')
  return JSON.parse(metadataString)
}
const handleReplaceManifestCanvasesFromFolder = async (event, data) => {
  try {
    const wipPath = store.get('wipPath')
    const { filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    if (!filePaths.length) return
    const loadingWindow = new BrowserWindow()
    loadingWindow.loadFile('loading.html')
    const folderPath = filePaths[0].replace(/\\/g, '/')
    const manifest = await replaceManifestCanvasesFromFolder(wipPath, folderPath, data)
    loadingWindow.close()
    return manifest
  } catch (e) {
    console.error("Error selecting folder:", e)
    dialog.showErrorBox('Error', 'Could not select folder.')
  }
}
const handleCreateManifestFromFolder = async () => {
  try {
    const wipPath = store.get('wipPath')
    const { filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    if (!filePaths.length) return
    const loadingWindow = new BrowserWindow()
    loadingWindow.loadFile('loading.html')
    const folderPath = filePaths[0].replace(/\\/g, '/')
    const manifest = await createManifest(wipPath, folderPath)
    loadingWindow.close()
    return manifest
  } catch (e) {
    console.error("Error selecting folder:", e)
    dialog.showErrorBox('Error', 'Could not select folder.')
  }
}
const handleOpenFile = async () => {
  const result = await dialog.showOpenDialog({
    title: 'Open Manifest JSON File',
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  })
  if (result.canceled) {
    return null
  }
  const filePath = result.filePaths[0]
  try {
    const fileData = fs.readFileSync(filePath, 'utf-8')
    const jsonData = JSON.parse(fileData)
    return jsonData
  } catch (error) {
    dialog.showErrorBox('Error', 'Could not read or parse the JSON file.')
    return null
  }
}
const handleExtractDc = async(event, data) => {
  const wipPath = store.get('wipPath')
  let result = writeDcCsv(wipPath, data)
  if(result.success){
    dialog.showMessageBox({
      type: 'info',       
      buttons: ['OK'],   
      title: 'Success',  
      message: 'The DC Metadata has been extracted!'
    }) 
    try {
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
      data['metadata'] = newMetadata
    } catch(e) {
      dialog.showErrorBox('Error', 'There was a problem when automatically removing the dc metadata from the manifest.')
    }
    return data
  } else {
    dialog.showErrorBox('Error', 'The DC Metadata could not be extracted.')
    return data
  }
}
const handleRelabelCanveses = async(event, data) => {
  try {
    console.log(data)
    let newItems = []
    let position = 1
    for (let canvas of data["items"]) { 
      canvas.label =  {
        "en": [
          `Image ${position}`
        ]
      }
      newItems.push(canvas)
      position = position + 1
    }
    data['items'] = newItems
    return data
  } catch(e) {
    dialog.showErrorBox('Error', 'There was a problem when re-labeling the canvases.')
  }
}
const handleSaveManifest = async(event, data) => {
  try {
    const wipPath = store.get('wipPath')
    let slug
    for (let field of data["metadata"]) { 
      if('en' in field['label'] && 'en' in field['value'] ) {
        if(field['label']['en'][0] === "Slug") {
          slug = field['value']['en'][0]
        }
      }
    }
    if(!slug) throw new Error('You need to add a Slug metadata element to the metadata array before saving.')
    const filePath = `${wipPath}crkn-scripting/new-manifests/${slug}.json`
    fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8')
    dialog.showMessageBox({
      type: 'info',       
      buttons: ['OK'],   
      title: 'Success',  
      message: `File saved successfully at: ${filePath}`
    }) 
    return true
  } catch (error) {
    dialog.showErrorBox('Error', `There was a problem saving the file. ${error}`)
    return false
  }
}

// App initialization
app.whenReady().then(() => {
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})