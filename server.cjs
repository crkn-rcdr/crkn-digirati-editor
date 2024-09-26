const { app, BrowserWindow } = require('electron')
const path = require('path')
const getFolderContentsArray = require('./utilities/getFolderContentsArray.cjs')
const { ipcMain } = require("electron")
const iiifBuilder = require('@iiif/builder')
const sizeOf = require("image-size")
const builder = new iiifBuilder.IIIFBuilder()
const iiifParser = require( '@iiif/parser' )
const { fork } = require('child_process')
const ps = fork(`${__dirname}/fileServer.cjs`)
console.log("Fileserver running in the bg: ", ps)
/*
const { download } = import('electron-dl')

testProject = /project/step 1
*/
const pathToWIP = "C:/Users/BrittnyLapierre/OneDrive - Canadian Research Knowledge Network/Documents/WIP"

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  ipcMain.handle("createManifest", (event, projectPath) => {
    console.log(`createManifest from frontend: ${projectPath}`)
    const files = getFolderContentsArray(pathToWIP + projectPath)
    console.log("files", files)
    let manifest = {
      "@context": "http://iiif.io/api/presentation/3/context.json",
      "type" : "Manifest",
      "id" : projectPath,
      "items": []
    }
    for (let filePath of files ) {
      let canvas = { }
      let annotPage = { }
      let annot = { }

      const dimensions = sizeOf(filePath)

      canvas.id = `canvas-${filePath}`
      canvas.type = "Canvas"
      canvas.width = dimensions.width
      canvas. height = dimensions.height
      annotPage.id = `annotPage-${filePath}`
      annotPage.type = "AnnotationPage"
      const ext = path.extname(filePath)
      const fileName = path.basename(filePath)
      const fileUrl = `file://${filePath}`//If need fileserver, use: `http://localhost:8000${projectPath}/${fileName}`
      annot.id = `annot-${filePath}`
      annot.type = "Annotation"
      annot.motivation = 'painting'
      annot.body = {
        id: fileUrl,
        type: 'Image',
        format: `image/jpeg`, //`image/${ext.replace('.', '')}`,
        width: dimensions.width,
        height: dimensions.height
      }
      annot.target=canvas.id

      annotPage.items = [annot]
      canvas.items = [annotPage]
      manifest.items.push(canvas)
    }
    console.log("manifest", JSON.stringify(manifest))
    return manifest
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