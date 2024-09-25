import { ManifestEditor } from "manifest-editor";
import "manifest-editor/dist/index.css";
import './App.css'
import { useEffect, useState } from "react"; //useCallback
// import { useExistingVault } from "react-iiif-vault";
// import { useSaveVault } from "@manifest-editor/shell";

function App() {
  const [data, setData] = useState();
  const manifestId = "https://www.canadiana.ca/iiif/oocihm.8_06911_32/manifest" 
  /*const vault = useExistingVault()
 
  const saveVault = useCallback(() => {
    // Save logic here.
    console.log("Eh?")
    console.log(vault.getObject(manifestId))
  }, []);
 
  useSaveVault(
    // The instance of the vault.
    vault,
    // Callback to save the vault.
    saveVault,
    // How often it should save the vault (debounce)
    5000
  );*/

  useEffect(() => {
    fetch(manifestId)
      .then((res) => res.json())
      .then((data) => {
        //vault.loadManifestSync(manifestId, data)
        setData(data)
      });
  }, []);
 
  if (!data) {
    return <div>Loading...</div>;
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
