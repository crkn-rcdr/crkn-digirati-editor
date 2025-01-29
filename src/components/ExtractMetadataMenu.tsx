import { useExistingVault } from "react-iiif-vault"
import { MenuItem } from '@chakra-ui/react'
/* Canvas tools, metadata tools */ 
export function ExtractMetadataMenu() {
    const vault = useExistingVault()
    let onExtractPress = () => {
        const manifestId = localStorage.getItem("manifest-id")
        if(typeof manifestId === "string") {
            const data = vault.toPresentation3({ id: manifestId, type: 'Manifest' })
            window.electronAPI.extractDc(data)
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
        <MenuItem
            onClick={onExtractPress}
            title="Extract the DC metadata from the Manifest">
            Extract DC
        </MenuItem>
    )
}