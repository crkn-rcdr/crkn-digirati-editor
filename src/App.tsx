
import "manifest-editor/dist/index.css"
import "./App.css"
import { ManifestEditor } from "manifest-editor"
import { VaultProvider } from "react-iiif-vault"
import { Vault } from "@iiif/helpers/vault"
import { useEffect, useState } from "react"
import { Button, ChakraProvider } from "@chakra-ui/react"
import { OpenManifestFromURLMenu } from "./components/OpenManifestFromURLMenu"
import { CreateManifestFromFilesMenu } from "./components/CreateManifestFromFilesMenu"
import { ChevronDownIcon} from "@chakra-ui/icons"
import {
  Menu,
  MenuButton,
  MenuList
} from "@chakra-ui/react"
import { WipSettingsMenu } from "./components/WipSettingsMenu"
import { WindmillSettingsMenu } from "./components/WindmillSettingsMenu"
import { OpenFileMenu } from "./components/OpenFileMenu"
import { SaveMenu } from "./components/SaveMenu"
import { OverwriteManifestCanvasesFromFolderMenu } from "./components/OverwriteManifestCanvasesFromFolderMenu"
import { RelabelCanvesesMenu } from "./components/RelabelCanvesesMenu"
//import { SaveMetadataProfileMenu } from "./components/SaveMetadataProfileMenu"
//import { GetMetadataProfileMenu } from "./components/GetMetadataProfileMenu"
/*

                    <Menu>
                      <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                        Metadata Tools
                      </MenuButton>
                      <MenuList>
                        <SaveMetadataProfileMenu/>
                        <GetMetadataProfileMenu/>
                      </MenuList>
                    </Menu>
*/

function App() {
  const vault = new Vault()
  const [data, setData] = useState()
  // On load
  useEffect(() => {
    console.log("Create")
    const manifest = localStorage.getItem("manifest-data")
    if(typeof manifest === "string") {
      try {
        let storedData = JSON.parse(manifest)
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
      if(typeof manifestId === "string") {
        const manifest = vault.getObject(manifestId)
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
                      Settings
                    </MenuButton>
                    <MenuList>
                      <WipSettingsMenu/>
                      <WindmillSettingsMenu/>
                    </MenuList>
                  </Menu>
                    <Menu>
                      <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                        Open
                      </MenuButton>
                      <MenuList>
                        <CreateManifestFromFilesMenu/>
                        <OpenFileMenu/>
                        <OpenManifestFromURLMenu/>
                      </MenuList>
                    </Menu>
                    
                    <Menu>
                      <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                        Canvas Tools
                      </MenuButton>
                      <MenuList>
                        <OverwriteManifestCanvasesFromFolderMenu/>
                        <RelabelCanvesesMenu/>
                      </MenuList>
                    </Menu>


                    <SaveMenu/>
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
                    Settings
                  </MenuButton>
                  <MenuList>
                    <WipSettingsMenu/>
                    <WindmillSettingsMenu/>
                  </MenuList>
                </Menu>
                <Menu>
                  <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                    Open
                  </MenuButton>
                  <MenuList>
                    <CreateManifestFromFilesMenu/>
                    <OpenFileMenu/>
                    <OpenManifestFromURLMenu/>
                  </MenuList>
                </Menu>
              </div>
            </ChakraProvider>
          }
      </VaultProvider>  
    )
}
export default App