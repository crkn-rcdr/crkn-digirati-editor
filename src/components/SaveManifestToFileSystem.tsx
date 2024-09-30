//import { useEffect } from "react"
import { useExistingVault } from "react-iiif-vault"
import { MenuItem } from '@chakra-ui/react'

export function SaveManifestToFileSystem() {
  const vault = useExistingVault()

  let onSelectPress = () => {
    console.log(vault)
    //Create hidden .manifest.json
    //Save images to folder
    /*window.electronAPI.createManifest()
      .then ( res => {
        try {
          vault.loadManifestObject(res["id"], res).then(manifest => {
            console.log("Loaded manifest: ", manifest)
          })
        } catch (e) {
          console.log("error loading to vault.")
        }
        
    })*/
  }


  return (
    <MenuItem
      onClick={onSelectPress}
      title="Select a folder">
        Write to Folder
    </MenuItem>
  )
}