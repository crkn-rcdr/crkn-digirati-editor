import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import App from './App.tsx'
import './index.css'

/*Todo: figure out linter*/
interface IElectronAPI {
  node: () => string,
  chrome: () => string,
  electron: () => string,
  replaceManifestCanvasesFromFolder: (data:any) => Promise<any>,
  addManifestCanvases: (data:any) => Promise<any>,
  createManifestFromFolder: () => Promise<any>,
  createManifestFromFiles: () => Promise<any>,
  openFile: () => Promise<any>,
  setWindmill: (data:any) => Promise<any>,
  setWipPath: () => Promise<any>,
  getWipPath: () => Promise<any>,
  setMetadataProfile: (data:any) => Promise<any>,
  getMetadataProfile: (data:any) => Promise<any>,
  relabelCanveses: (data:any) => Promise<any>,
  saveManifest: (data:any) => Promise<any>
}
declare global {
  interface Window {
    electronAPI: IElectronAPI
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChakraProvider value={defaultSystem}>
      <App />
    </ChakraProvider>
  </StrictMode>,
)
