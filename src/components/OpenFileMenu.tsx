//import { useExistingVault } from "react-iiif-vault"
import { MenuItem } from '@chakra-ui/react'

export function OpenFileMenu() {
  let onOpenPress = () => {
    window.electronAPI.openFile()
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
        onClick={onOpenPress}
        title="Open Manifest File">
          Open Manifest File
      </MenuItem>
  )
}