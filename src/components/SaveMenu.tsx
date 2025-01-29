//import { useEffect } from "react"
import { useExistingVault } from "react-iiif-vault"
import { Button } from '@chakra-ui/react'
export function SaveMenu() {
  const vault = useExistingVault()
  let onSave = () => {
    const manifestId = localStorage.getItem("manifest-id")
    if(typeof manifestId === "string") {
      const data = vault.toPresentation3({ id: manifestId, type: 'Manifest' })
      window.electronAPI.saveManifest(data)
        .then ( saveRes => { 
          try {
            console.log("Result", saveRes['data'])
          } catch (e) {
            console.log("error pushing to api.")
          }
        })
    }
  }
  return (
    <Button 
      onClick={onSave}
      title="Save manifest data on the WIP for ingest">
        Save
    </Button>
  )
}