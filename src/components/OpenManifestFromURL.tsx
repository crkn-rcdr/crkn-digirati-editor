//import { useEffect } from "react"
import { useExistingVault } from "react-iiif-vault"
import { MenuItem } from '@chakra-ui/react'

export function OpenManifestFromURL() {
  const vault = useExistingVault()
  /*useEffect(() => {
      popup
    })
  })*/

  let onOpen = () => {
    console.log(vault)
    //save images to new folder
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
    <h1>
      <MenuItem
        onClick={onOpen}
        title="Open manifest from url">
          Open URL
      </MenuItem>
    </h1>
  )
}