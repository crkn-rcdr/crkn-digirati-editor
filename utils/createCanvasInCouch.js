import nano from 'nano'
const couch = nano(`http://${process.env.COUCH_USER}:${process.env.COUCH_PASS}@${process.env.COUCH_HOST}:${process.env.COUCH_PORT}`);
const canvasDb = couch.db.use('canvas')
//canvasDb.get("69429/c00000000334").then(r => {console.log(r)})

/*
See: https://www.npmjs.com/package/node-couchdb
*/
export default async function createCanvasInCouch(noid, height, width, size, md5) {
    const encodedNoid = encodeURIComponent(noid)
    const canvas = {
        "_id": noid,
        "master": {
          "width": width,
          "extension": "jpg",
          "md5": md5,
          "size": size,
          "height": height,
          "mime": "image/jpeg"
        },
        "source": {
          "from": "IIIF",
          "url": `https://image-tor.canadiana.ca/iiif/2/${encodedNoid}/info.json`
        }
    }
    const canvasResult = await canvasDb.insert(canvas) //).then(({data, headers, status}) => {

    return canvasResult
}