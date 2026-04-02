
import "manifest-editor/dist/index.css"
import "./App.css"
import { ManifestEditor } from "manifest-editor"
import { VaultProvider } from "react-iiif-vault"
import { Vault } from "@iiif/helpers/vault"
import { useEffect, useState } from "react"
import { Button, Icon, Menu } from "@chakra-ui/react"
import { OpenManifestFromURLMenu } from "./components/OpenManifestFromURLMenu"
import { CreateManifestFromFilesMenu } from "./components/CreateManifestFromFilesMenu"
import { MdExpandMore } from "react-icons/md"
import { WipSettingsMenu } from "./components/WipSettingsMenu"
import { WindmillSettingsMenu } from "./components/WindmillSettingsMenu"
import { OpenFileMenu } from "./components/OpenFileMenu"
import { SaveMenu } from "./components/SaveMenu"
import { OverwriteManifestCanvasesFromFolderMenu } from "./components/OverwriteManifestCanvasesFromFolderMenu"
import { RelabelCanvesesMenu } from "./components/RelabelCanvesesMenu"
import { AddCanvasesMenu } from "./components/AddCanvasesMenu"

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
                <div style={{ width: "100vw", display: "flex", flexDirection: "row", background: "rgb(238 242 247)"}}>
                  <Menu.Root>
                    <Menu.Trigger asChild>
                      <Button colorPalette="gray" variant="subtle" gap="2">
                        Settings
                        <Icon boxSize="4">
                          <MdExpandMore />
                        </Icon>
                      </Button>
                    </Menu.Trigger>
                    <Menu.Positioner>
                      <Menu.Content>
                        <WipSettingsMenu/>
                        <br/>
                        <WindmillSettingsMenu/>
                      </Menu.Content>
                    </Menu.Positioner>
                  </Menu.Root>
                  <Menu.Root>
                    <Menu.Trigger asChild>
                      <Button colorPalette="gray" variant="subtle" gap="2">
                        Open
                        <Icon boxSize="4">
                          <MdExpandMore />
                        </Icon>
                      </Button>
                    </Menu.Trigger>
                    <Menu.Positioner>
                      <Menu.Content>
                        <CreateManifestFromFilesMenu/>
                        <OpenFileMenu/>
                        <OpenManifestFromURLMenu/>
                      </Menu.Content>
                    </Menu.Positioner>
                  </Menu.Root>
                  <Menu.Root>
                    <Menu.Trigger asChild>
                      <Button colorPalette="gray" variant="subtle" gap="2">
                        Canvas Tools
                        <Icon boxSize="4">
                          <MdExpandMore />
                        </Icon>
                      </Button>
                    </Menu.Trigger>
                    <Menu.Positioner>
                      <Menu.Content>
                        <AddCanvasesMenu/>
                        <OverwriteManifestCanvasesFromFolderMenu/>
                        <RelabelCanvesesMenu/>
                      </Menu.Content>
                    </Menu.Positioner>
                  </Menu.Root>
                  <SaveMenu/>
                </div>
                <ManifestEditor resource={{ id: data["id"], type: "Manifest" }} data={data as any}/>
              </div>
            :
            <div>
              <h1>Get started</h1>
              <Menu.Root>
                <Menu.Trigger asChild>
                  <Button colorPalette="gray" variant="subtle" gap="2">
                    Settings
                    <Icon boxSize="4">
                      <MdExpandMore />
                    </Icon>
                  </Button>
                </Menu.Trigger>
                <Menu.Positioner>
                  <Menu.Content>
                    <WipSettingsMenu/>
                    <br/>
                    <WindmillSettingsMenu/>
                  </Menu.Content>
                </Menu.Positioner>
              </Menu.Root>
              <Menu.Root>
                <Menu.Trigger asChild>
                  <Button colorPalette="gray" variant="subtle" gap="2">
                    Open
                    <Icon boxSize="4">
                      <MdExpandMore />
                    </Icon>
                  </Button>
                </Menu.Trigger>
                <Menu.Positioner>
                  <Menu.Content>
                    <CreateManifestFromFilesMenu/>
                    <OpenFileMenu/>
                    <OpenManifestFromURLMenu/>
                  </Menu.Content>
                </Menu.Positioner>
              </Menu.Root>
            </div>
          }
      </VaultProvider>  
    )
}
export default App
