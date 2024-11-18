//import { useExistingVault } from "react-iiif-vault"
import { MenuItem } from '@chakra-ui/react'

export function CreateManifestFromFolderMenu() {
  //const vault = useExistingVault()

  let onSelectPress = () => {
    window.electronAPI.createManifestFromFolder()
      .then ( res => {
        try {
          /*let id = (Math.random() + 1).toString(36).substring(7)
          res['id'] = id*/
          localStorage.removeItem("manifest-data")
          localStorage.setItem("manifest-id", res['id'])
          localStorage.setItem("manifest-data", JSON.stringify(res))
          window.location.reload()
          //vault.loadManifestSync(res['id'], res)
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