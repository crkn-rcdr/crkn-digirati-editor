import { useExistingVault } from "react-iiif-vault"
import { Button } from '@chakra-ui/react'
export function PublishManifestToAPIMenu() {
  const vault = useExistingVault()

  let onPublish = () => {
    const manifestId = localStorage.getItem("manifest-id")
    if(typeof manifestId === "string") {
      const data = vault.toPresentation3({ id: manifestId, type: 'Manifest' })
      window.electronAPI.pushManifestToApis(data)
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
    <Button onClick={onPublish}>Publish</Button>
  )
}