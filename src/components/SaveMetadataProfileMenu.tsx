import { useExistingVault } from "react-iiif-vault"
import { MenuItem } from '@chakra-ui/react'
export function SaveMetadataProfileMenu() {
    const vault = useExistingVault()
    let onSetMetadataProfile = () => {
        const manifestId = localStorage.getItem("manifest-id")
        if(typeof manifestId === "string") {
            const data = vault.toPresentation3({ id: manifestId, type: 'Manifest' })
            window.electronAPI.setMetadataProfile(data)
                .then ( () => {
                    try {
                        console.log("success.")
                    } catch (e) {
                        console.log(e)
                    }
                })
        }
    }
    return (
        <MenuItem
            onClick={onSetMetadataProfile}
            title="Save the current metadata values for future use">
            Set Metadata Profile
        </MenuItem>
    )
}