import { useExistingVault } from "react-iiif-vault"
import { MenuItem } from '@chakra-ui/react'

export function ReadManifestFromFileSystem(props: any) {
  const vault = useExistingVault()

  let onSelectPress = () => {
    const manifestId = localStorage.getItem("manifest-id")
    if(typeof manifestId === "string") {
      //const data = vault.toPresentation3({ id: manifestId, type: 'Manifest' })
      window.electronAPI.readManifestFromFileSystem()
        .then ( res => {
            let id = (Math.random() + 1).toString(36).substring(7)
            res['id'] = id
            localStorage.setItem("manifest-id", id)
            vault.loadManifestSync(res['id'], res)
      })
    }
  }

  return (
      <MenuItem
        onClick={onSelectPress}
        title={props.label}>
          {props.label}
      </MenuItem>
  )
}