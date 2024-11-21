
import "manifest-editor/dist/index.css"
import "./App.css"
import { ManifestEditor } from "manifest-editor"
import { VaultProvider } from "react-iiif-vault"
import { Vault } from "@iiif/helpers/vault"
import { useEffect, useState } from "react"
import { Button, ChakraProvider } from "@chakra-ui/react"
import { OpenManifestFromURLMenu } from "./components/OpenManifestFromURLMenu"
import { CreateManifestFromFolderMenu } from "./components/CreateManifestFromFolderMenu"
import { OpenLocalManifestMenu } from "./components/OpenLocalManifestMenu"
import { SaveManifestLocalyMenu } from "./components/SaveManifestLocalyMenu"
import { PublishManifestToAPIMenu } from "./components/PublishManifestToAPIMenu"
import { ChevronDownIcon} from "@chakra-ui/icons"
import {
  Menu,
  MenuButton,
  MenuList
} from "@chakra-ui/react"

function App() {
  const vault = new Vault()
  const [data, setData] = useState()
  // Set if exists
  useEffect(() => {
    const manifest = localStorage.getItem("manifest-data")
    if(typeof manifest === "string") {
      try {
        let storedData = JSON.parse(manifest)
        console.log("storedddd", manifest)
        setData(storedData as any)
        localStorage.removeItem("manifest-data") // So that window close starts you afresh
      } catch(e) {
        localStorage.clear()
        console.log(e)
      }
    }
  }, [])
  // Watch for changes
  vault.subscribe(() => {
    try {
      const manifestId = localStorage.getItem("manifest-id")
      console.log("manifestId", manifestId)
      if(typeof manifestId === "string") {
        const manifest = vault.getObject(manifestId)
        console.log("storedvaultddd", manifest)
        setData(manifest as any)
      }
    } catch (e) {
      console.log(e)
      localStorage.clear()
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
                        <CreateManifestFromFolderMenu/>
                        <OpenManifestFromURLMenu/>
                        <OpenLocalManifestMenu/>
                      </MenuList>
                    </Menu>
                    <SaveManifestLocalyMenu/>
                    <PublishManifestToAPIMenu/>
                  </div>
                </ChakraProvider>
                <ManifestEditor resource={{ id: data["id"], type: "Manifest" }} data={data as any}/>
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
                    <CreateManifestFromFolderMenu/>
                    <OpenManifestFromURLMenu/>
                    <OpenLocalManifestMenu/>
                  </MenuList>
                </Menu>
              </div>
            </ChakraProvider>
          }
      </VaultProvider>  
    )
}
export default App