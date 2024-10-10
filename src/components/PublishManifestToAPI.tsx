//import { useEffect } from "react"
import { useExistingVault } from "react-iiif-vault"
import { MenuItem } from '@chakra-ui/react'

export function PublishManifestToAPI() {
  const vault = useExistingVault()

  let onPublish = () => {
    console.log(vault)
    const manifestId = localStorage.getItem("manifest-id")
    if(typeof manifestId === "string") {
      const data = vault.toPresentation3({ id: manifestId, type: 'Manifest' })
      console.log("save", data)
      window.electronAPI.pushManifestToApis(data)
        .then ( res => { // {result, data}
          try {
            console.log("Result", res)
            if(res.result.success) {
              localStorage.setItem("manifest-data", JSON.stringify(res.data))
              window.location.reload()
            }
          } catch (e) {
            console.log("error loading to vault.")
          }
        })
    }
  }


  return (
      <MenuItem
        onClick={onPublish}
        title="Save and Publish to API">
          Save and Publish to API
      </MenuItem>
  )
}