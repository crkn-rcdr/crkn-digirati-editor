//import { useEffect } from "react"
import { useExistingVault } from "react-iiif-vault"
import { Button } from '@chakra-ui/react'

export function CreateManifestFromFolder() {
  const vault = useExistingVault()
  /*useEffect(() => {
    window.electronAPI.createManifest()
      .then ( res => {
        try {
          vault.loadManifestObject(res["id"], res).then(manifest => {
            console.log("Loaded manifest: ", manifest)
          })
        } catch (e) {
          console.log("error loading to vault.")
        }
        
    })
  })*/

  let onSelectPress = () => {
    window.electronAPI.createManifest()
      .then ( res => {
        try {
          vault.loadManifestObject(res["id"], res).then(manifest => {
            console.log("Loaded manifest: ", manifest)
          })
        } catch (e) {
          console.log("error loading to vault.")
        }
        
    })
  }


  return (
    <h1>
      <Button
        onClick={onSelectPress}
        title="Select a folder"
        colorScheme="pink">
          Read from Folder
      </Button>
    </h1>
  )
}