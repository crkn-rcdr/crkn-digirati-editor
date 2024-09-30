const { contextBridge, ipcRenderer, dialog } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  // we can also expose variables, not just functions
  createManifest: () => ipcRenderer.invoke('createManifest'),
  saveManifestJSON: (data) => ipcRenderer.invoke('saveManifestJSON', data)
})