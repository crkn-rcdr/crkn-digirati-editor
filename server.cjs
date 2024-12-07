const { app, BrowserWindow, session, ipcMain, dialog } = require('electron')
const path = require('path')
const writeDcCsv = require("./utilities/writeDcCsv.cjs")
const { createManifest } = require("./utilities/manifestCreation.cjs")
const Store = require('electron-store')
const fs = require('fs')
const editorApiUrl = 'https://crkn-asset-manager.azurewebsites.net'// 'http://localhost:8000' // https://crkn-asset-manager.azurewebsites.net
const store = new Store()
//let AUTH_TOKEN
const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  ipcMain.handle("createManifestFromFolder", handleCreateManifestFromFolder)
  ipcMain.handle('openFile', handleOpenFile)
  ipcMain.handle('setWipPath', handleSetWipPath)
  ipcMain.handle('getWipPath', handleGetWipPath)
  ipcMain.handle('extractDc', handleExtractDc)
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
// Handle manifest push to APIs
/*const handlePushManifest = async (event, data) => {
  const loadingWindow = new BrowserWindow()
  try {
    const wipPath = await handleGetWipPath()
    if (wipPath === 'No WIP folder set.') {
      throw new Error('No WIP folder set. Go into the settings to set your WIP path.')
    }
    loadingWindow.loadFile('saving.html')
    const result = writeDcCsv(data) // TODO: Move this to own menu item
    if (!result.success) {
      throw new Error(result.message)
    }
    //const result = { success: true, message: "not doing for testing"}
    data = await pushManifest(data, loadingWindow, AUTH_TOKEN)
    return { result, data }
  } catch (e) {
    console.error("Error pushing manifest:", e)
    dialog.showErrorBox('Error', e.message)
    return { result: { success: false, message: e.message }, data }
  } finally {
    //loadingWindow.close()
  }
}
// Handle saving manifests to local db
const handleListManifestLocally = async (event) => {
  try {
    const list = await listManifest()
    return list
  } catch (e) {
    console.error("Error saving manifest:", e)
    dialog.showErrorBox('Error', 'Could not list manifests.')
  }
}
const handleGetManifestLocally = async (event, id) => {
  try {
    console.log("id", id)
    const data = await getManifest(id)
    console.log("data", data)
    return data
  } catch (e) {
    console.error("Error saving manifest:", e)
    dialog.showErrorBox('Error', 'Could not get manifest.')
  }
}
const handleSetManifestLocally = async (event, data) => {
  try {
    const res = await setManifest(data)
    return { res }
  } catch (e) {
    console.error("Error saving manifest:", e)
    dialog.showErrorBox('Error', 'Could not save manifest.')
  }
}*/


// App initialization
app.whenReady().then(() => {
  /*const authWindow = new BrowserWindow({ webPreferences: { nodeIntegration: false } })
  authWindow.loadURL(`${editorApiUrl}/auth/login`)

  authWindow.webContents.on('did-redirect-navigation', () => {
    session.defaultSession.cookies.get({ name: 'token' })
      .then(cookies => {
        if (cookies.length) {
          AUTH_TOKEN = cookies[0].value
          authWindow.close()
        }
      }).catch(console.error)
  })

  authWindow.on('closed', createWindow)*/
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})