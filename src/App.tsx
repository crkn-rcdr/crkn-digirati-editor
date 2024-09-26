import { ManifestEditor } from "manifest-editor"
import "manifest-editor/dist/index.css"
import './App.css'
import { useEffect, useState } from "react" //useCallback
//import { useExistingVault } from "react-iiif-vault"
//import { useSaveVault } from "@manifest-editor/shell"

/*
const builder = new IIIFBuilder(vault);
builder.editManifest(manifest.id, (mani: any) => {
  mani.createCanvas(newCanvasID, (can: any) => {
    can.entity.id = newCanvasID;
    can.height = inputed?.height;
    can.width = inputed?.width;
    can.createAnnotation(`${newCanvasID}/painting`, {
      id: `${newCanvasID}/painting`,
      type: "Annotation",
      motivation: "painting",
      body: {
        id: inputValue,
        type: "Image",
        format: inputed?.format,
        height: inputed?.height,
        width: inputed?.width,
      },
    });
  });
});
*/

function App() {
  const [data, setData] = useState()
  //const vault = useExistingVault()
  let testProject = "/project/step 1"
  const manifestId = testProject

  /*
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
  )*/

  useEffect(() => {
    /*const localDataText = localStorage.getItem(manifestId)
    if(typeof localDataText === "string" && localDataText !== "__$UNSET$__") {
      console.log('Loading from local store')
      const localData = JSON.parse(localDataText)
      setData(localData)
    } else {
      fetch(manifestId)
        .then((res) => res.json())
        .then((data) => {
          setData(data)
        })
    }*/
    window.electronAPI.createManifest(testProject)
      .then ( res => {
        console.log("data", res)
        setData(res)
      })
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
