import crypto from 'crypto'
// See: https://dev.to/saranshk/how-to-get-the-hash-of-a-file-in-nodejs-1bdk
export default function getHash (stream) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256')
    stream.on('error', reject);
    stream.on('data', chunk => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}