const { app, BrowserWindow, session, ipcMain, dialog } = require('electron')
const path = require('path')
const writeDcCsv = require("./utilities/writeDcCsv.cjs")
const { createManifest } = require("./utilities/manifestCreation.cjs")
const { pushManifest } = require("./utilities/pushManifest.cjs")
const { setManifest, getManifest, listManifest } = require("./utilities/manifestStore.cjs")
const editorApiUrl = 'http://localhost:8000'

// Global variable for auth token
let AUTH_TOKEN

// Main application window creation
const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  ipcMain.handle("listManifestLocally", handleListManifestLocally)
  ipcMain.handle("getManifestLocally", handleGetManifestLocally)
  ipcMain.handle("setManifestLocally", handleSetManifestLocally)
  ipcMain.handle("pushManifestToApis", handlePushManifest)
  ipcMain.handle("createManifestFromFolder", handleCreateManifestFromFolder)

  win.loadFile(path.join(__dirname, '/dist/index.html'))
}

// Handle creation of manifest from a folder
const handleCreateManifestFromFolder = async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    if (!filePaths.length) return
    const folderPath = filePaths[0].replace(/\\/g, '/')
    return await createManifest(folderPath, null)
  } catch (e) {
    console.error("Error selecting folder:", e)
    dialog.showErrorBox('Error', 'Could not select folder.')
  }
}

// Handle manifest push to APIs
const handlePushManifest = async (event, data) => {
  const loadingWindow = new BrowserWindow()
  try {
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
}

// App initialization
app.whenReady().then(() => {
  const authWindow = new BrowserWindow({ webPreferences: { nodeIntegration: false } })
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

  authWindow.on('closed', createWindow)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})