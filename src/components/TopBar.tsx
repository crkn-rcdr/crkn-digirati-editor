import { useManifest } from "react-iiif-vault";
import { FolderSelector } from "./FolderSelector";
import { OpenManifest } from "./OpenManifest";
 
export function TopBar() {
  const manifest = useManifest();
 
  if (!manifest) return null;
 
  // LocaleString will choose a language based on the user's browser settings by default.
  return (
    <h1>
      <FolderSelector/>
      <OpenManifest/>
    </h1>
  )
}