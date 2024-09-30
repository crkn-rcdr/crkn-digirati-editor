//import { useEffect } from "react"
import { useExistingVault } from "react-iiif-vault"
import { Button } from '@chakra-ui/react'

export function OpenManifestFromURL() {
  const vault = useExistingVault()
  /*useEffect(() => {
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
  })*/

  let onOpen = () => {
    console.log(vault)
    /*window.electronAPI.createManifest()
      .then ( res => {
        try {
          vault.loadManifestObject(res["id"], res).then(manifest => {
            console.log("Loaded manifest: ", manifest)
          })
        } catch (e) {
          console.log("error loading to vault.")
        }
        
    })*/
  }


  return (
    <h1>
      <Button
        onClick={onOpen}
        title="Open manifest from url"
        colorScheme="pink">
          Open URL
      </Button>
    </h1>
  )
}