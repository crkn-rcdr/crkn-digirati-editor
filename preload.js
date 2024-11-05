const { contextBridge, ipcRenderer, dialog } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  // we can also expose variables, not just functions
  createManifestFromFolder: () => ipcRenderer.invoke('createManifestFromFolder'),
  pushManifestToApis: (data) => ipcRenderer.invoke('pushManifestToApis', data),
  triggerLegacyIngest: (slug) => ipcRenderer.invoke('triggerLegacyIngest', slug),
})