import NodeCouchDb from 'node-couchdb'
const couchExternal = new NodeCouchDb({
    host: process.env.COUCH_HOST,
    protocol: 'http',
    port: process.env.COUCH_PORT,
    auth: {
        user: process.env.COUCH_USER,
        pass: process.env.COUCH_PASS
    }
})

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
    const canvasResult = couch.insert("canvas", canvas) //).then(({data, headers, status}) => {
    return canvasResult.data
}