import { useEffect } from "react"
import { useExistingVault } from "react-iiif-vault"
 
export function FolderSelector() {
  const vault = useExistingVault()
  useEffect(() => {
    window.electronAPI.createManifest()
      .then ( res => {
        try {
          vault.loadManifestObject(res["id"], res).then(manifest => {
            console.log("Loaded manifest: ", manifest)
          })
        } catch (e) {
          console.log("error loading to vault.")
        }
        
    })
  })
  return (
    <h1>
      FolderSelector
    </h1>
  )
}