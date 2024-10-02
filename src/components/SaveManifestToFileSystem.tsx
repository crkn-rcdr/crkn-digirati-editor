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
            localStorage.setItem("manifest-data", JSON.stringify(res))
            window.location.reload()
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