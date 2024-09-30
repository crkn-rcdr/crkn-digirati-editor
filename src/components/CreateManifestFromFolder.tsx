import { useExistingVault } from "react-iiif-vault"
import { MenuItem } from '@chakra-ui/react'

export function CreateManifestFromFolder() {
  const vault = useExistingVault()

  let onSelectPress = () => {
    window.electronAPI.createManifest()
      .then ( res => {
        try {
          let id = (Math.random() + 1).toString(36).substring(7)
          res['id'] = id
          localStorage.setItem("manifest-id", id)
          vault.loadManifestSync(res['id'], res)
        } catch (e) {
          console.log(e)
        }
    })
  }


  return (
      <MenuItem
        onClick={onSelectPress}
        title="Select a folder">
          Read from Folder
      </MenuItem>
  )
}