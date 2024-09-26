export interface IElectronAPI {
  node: () => string,
  chrome: () => string,
  electron: () => string,
  createManifest: () => Promise<void>,
}
declare global {
  interface Window {
    electronAPI: IElectronAPI
  }
}