import { useManifest } from "react-iiif-vault";
 
export function OpenManifest() {
  const manifest = useManifest();
 
  if (!manifest) return null;
 
  // LocaleString will choose a language based on the user's browser settings by default.
  return (
    <h1>
      OpenManifest
    </h1>
  )
}