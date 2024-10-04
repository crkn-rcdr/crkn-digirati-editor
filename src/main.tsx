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
  readManifestFromFileSystem: () => Promise<any>,
  saveManifestJSON: (data:any) => Promise<any>,
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
