import { ManifestEditor } from "manifest-editor"
import "manifest-editor/dist/index.css"
import './App.css'
import { useEffect, useCallback, useState } from "react" //useCallback
import { useExistingVault } from "react-iiif-vault"
import { useSaveVault } from "@manifest-editor/shell"

function App() {
  const [data, setData] = useState()
  const manifestId = "https://www.canadiana.ca/iiif/oocihm.8_06911_32/manifest" 
  const vault = useExistingVault()

  const saveVault = useCallback(() => {
    const vaultData = vault.toPresentation3({ id: manifestId, type: 'Manifest' })
    if(typeof vaultData !== "undefined" && vaultData !== "__$UNSET$__") {
      localStorage.setItem(manifestId, JSON.stringify(vaultData))
    } else {
      console.log("Vault data undefined, nothing to save.")
    }    
  }, [])
 
  useSaveVault(
    vault,
    saveVault,
    5000
  )

  useEffect(() => {
    const localDataText = localStorage.getItem(manifestId)
    if(typeof localDataText === "string" && localDataText !== "__$UNSET$__") {
      const localData = JSON.parse(localDataText)
      setData(localData)
    } else {
      fetch(manifestId)
        .then((res) => res.json())
        .then((data) => {
          setData(data)
        })
    }
  }, [])
 
  if (!data) {
    return <div>Loading...</div>
  }

  return (
    <>
      <div style={{ width: "100vw", height: "100vh", display: "flex" }}>
        <ManifestEditor resource={{ id: manifestId, type: "Manifest" }} data={data}/>
      </div>
    </>
  )
}

export default App
