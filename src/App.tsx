
import "manifest-editor/dist/index.css"
import './App.css'
import { ManifestEditor } from "manifest-editor"
import { FolderSelector } from "./components/FolderSelector"
import { VaultProvider } from "react-iiif-vault"
import { Vault } from "@iiif/helpers/vault"
import { useState } from "react"
//import { TopBar } from "./components/TopBar"

function App() {
  const manifestId = "Digitization Project"
  const vault = new Vault()
  const [data, setData] = useState()
  vault.subscribe(() => {
    const manifest = vault.getObject(manifestId)
    setData(manifest)
  }, true)
    return (
      <VaultProvider vault={vault}>
         {  data ? 
              <div style={{ width: "100vw", height: "100vh", display: "flex" }}>
                  <ManifestEditor resource={{ id: manifestId, type: "Manifest" }} data={data as any}/>
              </div>
            :
              <div>
                <h1>Pick a project folder or enter a manifest URL to get started.</h1>
                <FolderSelector/>
              </div>
          }
      </VaultProvider>  
    )
}
export default App


/*const saveVault = useCallback(() => {
    const vaultData = vault.toPresentation3({ id: manifestId, type: 'Manifest' })
    if(typeof vaultData !== "undefined" && vaultData !== "__$UNSET$__" && vaultData !== null) {
      localStorage.setItem(manifestId, JSON.stringify(vaultData))
    } else {
      console.log("Vault data undefined, nothing to save.")
    }    
  }, [])
  useSaveVault(
    vault,
    saveVault,
    5000
  )
  useEffect(() => {
    const localDataText = localStorage.getItem(manifestId)
    if(typeof localDataText === "string" && localDataText !== "__$UNSET$__") {
      console.log('Loading from local store')
      const localData = JSON.parse(localDataText)
      setData(localData as any)
    }
  }, [])*/
 