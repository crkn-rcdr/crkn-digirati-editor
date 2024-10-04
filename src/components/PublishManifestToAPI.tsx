//import { useEffect } from "react"
import { useExistingVault } from "react-iiif-vault"
import { MenuItem } from '@chakra-ui/react'

export function PublishManifestToAPI() {
  const vault = useExistingVault()

  let onPublish = () => {
    console.log(vault)
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
        onClick={onPublish}
        title="Publish on Canadiana">
          Publish on Canadiana
      </MenuItem>
  )
}