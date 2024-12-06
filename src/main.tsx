import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

/*Todo: figure out linter*/
interface IElectronAPI {
  node: () => string,
  chrome: () => string,
  electron: () => string,
  createManifestFromFolder: () => Promise<any>,
  openFile: () => Promise<any>,
  setWipPath: () => Promise<any>,
  getWipPath: () => Promise<any>,
  extractDc: (data:any) => Promise<any>,
  saveManifest: (data:any) => Promise<any>
}
declare global {
  interface Window {
    electronAPI: IElectronAPI
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
