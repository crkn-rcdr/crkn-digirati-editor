const { contextBridge, ipcRenderer, dialog } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  // we can also expose variables, not just functions
  createManifestFromFolder: () => ipcRenderer.invoke('createManifestFromFolder'),
  openFile: () => ipcRenderer.invoke('openFile'),
  //pushManifestToApis: (data) => ipcRenderer.invoke('pushManifestToApis', data),
  //setManifestLocally: (data) => ipcRenderer.invoke('setManifestLocally', data),
  //getManifestLocally: (id) => ipcRenderer.invoke('getManifestLocally', id),
  //listManifestLocally: () => ipcRenderer.invoke('listManifestLocally'),
  //triggerLegacyIngest: (slug) => ipcRenderer.invoke('triggerLegacyIngest', slug),
  setWipPath: () => ipcRenderer.invoke('setWipPath'),
  getWipPath: () => ipcRenderer.invoke('getWipPath'),
  extractDc: (data) => ipcRenderer.invoke('extractDc', data),
  saveManifest: (data) => ipcRenderer.invoke('saveManifest', data)
})