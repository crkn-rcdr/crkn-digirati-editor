import { useExistingVault } from "react-iiif-vault"
import { MenuItem } from '@chakra-ui/react'

export function AddCanvasesMenu() {
    const vault = useExistingVault()

    const onAddPress = () => {
        const manifestId = localStorage.getItem("manifest-id")
        if (typeof manifestId === "string") {
            const data = vault.toPresentation3({ id: manifestId, type: 'Manifest' })
            window.electronAPI.addManifestCanvases(data)
                .then(res => {
                    if (!res) return
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
            value="add-canvases"
            onSelect={onAddPress}
            title="Add canvases to the end of the manifest and relabel all canvases">
            Add Canvases
        </MenuItem>
    )
}
