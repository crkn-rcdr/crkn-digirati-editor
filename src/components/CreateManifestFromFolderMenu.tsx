import { MenuItem } from '@chakra-ui/react'

export function CreateManifestFromFolderMenu() {
  let onCreatePress = () => {
    window.electronAPI.createManifestFromFolder()
      .then ( res => {
        try {
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
        onClick={onCreatePress}
        title="Create New Manifest from Folder">
          Create New Manifest from Folder
      </MenuItem>
  )
}