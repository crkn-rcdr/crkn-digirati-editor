const { app, BrowserWindow } = require('electron')
const path = require('path')
const { download } = import('electron-dl')

const getFolderContentsArray = require('./utilities/getFolderContentsArray.cjs')
/*
download(win, url, {
    directory: "/path/to/my/directory/"
})
/project
For creation of manifests use fule urls, ex:

const remote = window.require('electron').remote
const electronFs = remote.require('fs')
const electronDialog = remote.dialog

fs.readdir(testFolder, (err, files) => {
  files.forEach(file => {
      console.log(file)
  })
})


*/
const pathToWIP = "C:/Users/BrittnyLapierre/OneDrive - Canadian Research Knowledge Network/Documents/WIP/project/step 1"

const files = getFolderContentsArray(pathToWIP)

console.log("files", files)


const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 900
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