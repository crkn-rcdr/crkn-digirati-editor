import { useExistingVault } from "react-iiif-vault"
import { Button } from '@chakra-ui/react'
export function RelabelCanvesesMenu() {
    const vault = useExistingVault()
    let onExtractPress = () => {
        const manifestId = localStorage.getItem("manifest-id")
        if(typeof manifestId === "string") {
            const data = vault.toPresentation3({ id: manifestId, type: 'Manifest' })
            window.electronAPI.relabelCanveses(data)
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
    }
    return (
        <Button
            onClick={onExtractPress}
            title="Relabel canvases to match their position in the manifest">
            Relabel Canvases
        </Button>
    )
}