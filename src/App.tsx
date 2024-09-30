
import "manifest-editor/dist/index.css"
import './App.css'
import { ManifestEditor } from "manifest-editor"
import { VaultProvider } from "react-iiif-vault"
import { Vault } from "@iiif/helpers/vault"
import { useState } from "react"
import { Button, ChakraProvider } from '@chakra-ui/react'
import { OpenManifestFromURL } from "./components/OpenManifestFromURL"
import { CreateManifestFromFolder } from "./components/CreateManifestFromFolder"
import { SaveManifestToFileSystem } from "./components/SaveManifestToFileSystem"
import { PublishManifestToAPI } from "./components/PublishManifestToAPI"
import { ChevronDownIcon} from '@chakra-ui/icons'
import {
  Menu,
  MenuButton,
  MenuList
} from '@chakra-ui/react'
import { UpdateManifestFromFolder } from "./components/UpdateManifestFromFolder"


function App() {
  const vault = new Vault()
  const [data, setData] = useState()
  vault.subscribe(() => {
    try {
      const manifestId = localStorage.getItem("manifest-id")
      if(typeof manifestId === "string") {
        const manifest = vault.getObject(manifestId)
        setData(manifest as any)
      }
    } catch (e) {
      console.log(e)
    }
  }, true)
    return (
      <VaultProvider vault={vault}>
         {  data ? 
              <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column"}}>
                <ChakraProvider>
                  <div style={{ width: "100vw", display: "flex", flexDirection: "row", background: "rgb(238 242 247)"}}>              
                    <Menu>
                      <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                        Open
                      </MenuButton>
                      <MenuList>
                        <UpdateManifestFromFolder/>
                        <OpenManifestFromURL/>
                      </MenuList>
                    </Menu>
                    <Menu>
                      <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                        Save
                      </MenuButton>
                      <MenuList>
                        <SaveManifestToFileSystem/>
                        <PublishManifestToAPI/>
                      </MenuList>
                    </Menu>
                  </div>
                </ChakraProvider>
                <ManifestEditor resource={{ id: data['id'], type: "Manifest" }} data={data as any}/>
              </div>
            :
            <ChakraProvider>
              <div>
                <h1>Get started</h1>
                <Menu>
                  <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                    Open
                  </MenuButton>
                  <MenuList>
                    <CreateManifestFromFolder/>
                    <OpenManifestFromURL/>
                  </MenuList>
                </Menu>
              </div>
            </ChakraProvider>
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
 