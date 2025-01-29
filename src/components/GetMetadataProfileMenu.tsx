import { useExistingVault } from "react-iiif-vault"
import { MenuItem } from '@chakra-ui/react'
export function GetMetadataProfileMenu() {
    const vault = useExistingVault()
    let onGetMetadataProfilePress = () => {
        const manifestId = localStorage.getItem("manifest-id")
        if(typeof manifestId === "string") {
            let data: any = vault.toPresentation3({ id: manifestId, type: 'Manifest' })
            window.electronAPI.getMetadataProfile(data)
                .then ( res => {
                    try {
                        localStorage.setItem("manifest-id", manifestId)
                        data["metadata"] = res
                        localStorage.setItem("manifest-data", JSON.stringify(data))
                        window.location.reload()
                    } catch (e) {
                        console.log(e)
                    }
                })
        }
    }
    return (
        <MenuItem
            onClick={onGetMetadataProfilePress}
            title="Load previosly saved metadata into this manifest">
            Load Metadata Profile
        </MenuItem>
    )
}