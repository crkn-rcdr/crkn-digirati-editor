//import { useEffect } from "react"
import { useExistingVault } from "react-iiif-vault"
import { MenuItem } from '@chakra-ui/react'

export function SaveManifestToFileSystem() {
  const vault = useExistingVault()

  let onSelectPress = () => {
    console.log(vault)
    const manifestId = localStorage.getItem("manifest-id")
    if(typeof manifestId === "string") {
      const data = vault.toPresentation3({ id: manifestId, type: 'Manifest' })
      console.log("save", data)
      window.electronAPI.saveManifestJSON(data)
        .then ( res => {
          try {
            console.log("Result", res)
            /*let id = (Math.random() + 1).toString(36).substring(7)
            res['id'] = id
            localStorage.setItem("manifest-id", id)
            vault.loadManifestSync(res['id'], res)*/
          } catch (e) {
            console.log("error loading to vault.")
          }
        })
    }
    
  }


  return (
    <MenuItem
      onClick={onSelectPress}
      title="Select a folder">
        Write to Folder
    </MenuItem>
  )
}