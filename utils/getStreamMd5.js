import crypto from 'crypto'
import { readFileSync } from 'fs' 
// See: https://dev.to/saranshk/how-to-get-the-hash-of-a-file-in-nodejs-1bdk
export default function getHash (stream) {
  const readmd5 = readFileSync("output.jpg");
  return crypto.createHash("md5").update(readmd5).digest("hex");
}