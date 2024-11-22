//import { useExistingVault } from "react-iiif-vault"
import { MenuItem } from '@chakra-ui/react'

export function CreateManifestFromFolderMenu() {
  //const vault = useExistingVault()

  let onSelectPress = () => {
    window.electronAPI.createManifestFromFolder()
      .then ( res => {
        try {
          localStorage.removeItem("manifest-data")
          localStorage.setItem("manifest-id", res['id'])
          localStorage.setItem("manifest-data", JSON.stringify(res))
          window.location.reload()
        } catch (e) {
          console.log(e)
        }
    })
  }


  return (
      <MenuItem
        onClick={onSelectPress}
        title="Create New Manifest from Folder">
          Create New Manifest from Folder
      </MenuItem>
  )
}