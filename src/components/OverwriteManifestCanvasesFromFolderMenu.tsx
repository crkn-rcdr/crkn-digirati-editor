import { useExistingVault } from "react-iiif-vault"
import { MenuItem } from '@chakra-ui/react'
export function OverwriteManifestCanvasesFromFolderMenu() {
    const vault = useExistingVault()
    let onOverwritePress = () => {
        const manifestId = localStorage.getItem("manifest-id")
        if(typeof manifestId === "string") {
            const data = vault.toPresentation3({ id: manifestId, type: 'Manifest' })
            window.electronAPI.replaceManifestCanvasesFromFolder(data)
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
            onClick={onOverwritePress}
            title="Overwrite Manifest Canvases from a Folder">
            Overwite Canvases
        </MenuItem>
    )
}