const { app, BrowserWindow } = require('electron')
const path = require('path')
const { download } = require('electron-dl')
/*
download(win, url, {
    directory: "/path/to/my/directory/"
})

const pathToWIP = "C:/Users/BrittnyLapierre/OneDrive - Canadian Research Knowledge Network/Documents/WIP"
/project
For creation of manifests use fule urls, ex: file:///C:/Users/BrittnyLapierre/OneDrive%20-%20Canadian%20Research%20Knowledge%20Network/Pictures/kitten.jpg

const remote = window.require('electron').remote;
const electronFs = remote.require('fs');
const electronDialog = remote.dialog;

fs.readdir(testFolder, (err, files) => {
  files.forEach(file => {
      console.log(file);
  });
});

https://jakelunn.medium.com/simple-file-tree-electron-es6-71e8abc2c52
*/
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