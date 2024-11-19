//import { useEffect } from "react"
import { useExistingVault } from "react-iiif-vault"
import { Button } from '@chakra-ui/react'
export function SaveManifestLocalyMenu() {
  const vault = useExistingVault()

  let onSave = () => {
    console.log(vault)
    const manifestId = localStorage.getItem("manifest-id")
    if(typeof manifestId === "string") {
      const data = vault.toPresentation3({ id: manifestId, type: 'Manifest' })
      console.log("save", data)
      window.electronAPI.setManifestLocally(data)
        .then ( saveRes => { // {result, data}
          try {
            console.log("Result", saveRes['data'])
            if(saveRes.result.success) {
              localStorage.setItem("manifest-data", JSON.stringify(saveRes.data))
              localStorage.setItem("manifest-id", saveRes.data.id)
              //window.location.reload()
            }
          } catch (e) {
            console.log("error pushing to api.")
          }
        })
    }
  }


  return (
    <Button onClick={onSave}>Save</Button>
  )
}