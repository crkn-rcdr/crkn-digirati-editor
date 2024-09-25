import { ManifestEditor } from "manifest-editor"
import "manifest-editor/dist/index.css"
import './App.css'
import { useEffect, useState, useCallback } from "react" //useCallback
import { useExistingVault } from "react-iiif-vault"
import { useSaveVault } from "@manifest-editor/shell"

function App() {
  const [data, setData] = useState()
  const manifestId = "https://www.canadiana.ca/iiif/oocihm.8_06911_32/manifest" 
  const vault = useExistingVault()
 
  const saveVault = useCallback(() => {
    // Save logic here.
    console.log("Reading from vault")
    const vaultData = vault.getObject(manifestId)
    if(typeof vaultData !== "undefined") {
      setData(vaultData)
      // Save the data to localstorage
      const dataString = JSON.stringify(vaultData)
      console.log("ds: ", dataString)
      localStorage.setItem(manifestId, dataString)
      //const dataString2 = JSON.stringify(vault.getState().iiif.entities.Manifest)
      //console.log("ds2: ", dataString2)
    } else {
      console.log("Vault data undef")
    }

    
  }, [])
 
  useSaveVault(
    // The instance of the vault.
    vault,
    // Callback to save the vault.
    saveVault,
    // How often it should save the vault (debounce)
    5000
  )

  useEffect(() => {
    const vaultDataText = localStorage.getItem(manifestId)
    if(typeof vaultDataText === "string" && vaultDataText !== "null") {
      console.log("Localstore:", vaultDataText )
      vault.loadManifestSync(manifestId, JSON.parse(vaultDataText))
    } else {
      fetch(manifestId)
        .then((res) => res.json())
        .then((data) => {
          vault.loadManifestSync(manifestId, data)
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
