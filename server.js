import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import fastifyMultipart from '@fastify/multipart'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import imageApiStorage from './utils/imageApiStorage.js'
import imageConversion from './utils/imageConversion.js'
import getStreamMd5 from './utils/getStreamMd5.js'
import mintNoid from './utils/mintNoid.js'
import createCanvasInCouch from './utils/createCanvasInCouch.js'
import fs from 'fs/promises'
import { createReadStream } from 'fs' 

const imageApiStorageClient = imageApiStorage()

const port = process.env.PORT || 8000
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const fastify = Fastify({
  logger: true
})
fastify.register(fastifyStatic, {
    root: path.join(__dirname, 'dist'),
})

fastify.register(fastifyMultipart, {
   throwFileSizeLimit: false
})

fastify.get('/', function (req, reply) {
  reply.sendFile('index.html')
})

// Delete
// ...

// Replace
// ...

// Create
fastify.post('/createCanvas', async function (req, reply) {
  // process a single image file
  const data = await req.file({
   limits: {
     fileSize: 100 * 1024 * 1024,  // 1mb limit
   }
 })
  console.log("data.file", data.file)
  /*
  data.file // stream
  data.fields // other parsed parts
  data.fieldname
  data.filename
  data.encoding
  data.mimetype
  */
  const sequenceNum = 1
  const manifestNoid = await mintNoid('manifest') // data.<> ||

  // Decrease quality
  let buffer = await data.toBuffer() //await pipeline(data.file, fs.createWriteStream(data.filename))
  //await fs.writeFile('original.jpg', buffer)
  const imageInfo = await imageConversion(buffer)

  // Create records in swift and database
  const canvasNoid = await mintNoid('canvas')
  console.log("canvasNoid", `${canvasNoid}.jpg`)

  const stream = createReadStream('output.jpg')
  let swiftResult = await imageApiStorageClient.accessFiles.create(`${canvasNoid}.jpg`, stream)
  console.log("swiftResult", swiftResult)
  let md5 = getStreamMd5(stream)
  console.log(
   canvasNoid, 
   imageInfo.height, 
   imageInfo.width, 
   imageInfo.size, 
   md5
  )
  let couchResult = await createCanvasInCouch(
    canvasNoid, 
    imageInfo.height, 
    imageInfo.width, 
    imageInfo.size, 
    md5
  )
  console.log("couchResult", couchResult)

  // Return remote canvas info
  const encodedNoid = encodeURIComponent(canvasNoid)
  reply.send(
   {
      "id": `https://crkn-iiif-presentation-api.azurewebsites.net/canvas/${canvasNoid}`,
      "height": imageInfo.height,
      "width": imageInfo.width,
      "thumbnail": [
          {
              "id": `https://image-tor.canadiana.ca/iiif/2/${encodedNoid}/full/max/0/default.jpg`,
              "type": "Image",
              "format": "image/jpeg"
          }
      ],
      "items": [
          {
              "id": `https://crkn-iiif-presentation-api.azurewebsites.net/${manifestNoid}/annotationpage/${canvasNoid}/main`,
              "type": "AnnotationPage",
              "items": [
                  {
                      "id": `https://crkn-iiif-presentation-api.azurewebsites.net/${manifestNoid}/annotation/${canvasNoid}/main/image`,
                      "body": {
                          "id": `https://image-tor.canadiana.ca/iiif/2/${encodedNoid}/full/max/0/default.jpg`,
                          "type": "Image",
                          "width": imageInfo.width,
                          "format": "image/jpeg",
                          "height": imageInfo.height,
                          "service": [
                              {
                                  "id": `https://image-tor.canadiana.ca/iiif/2/${encodedNoid}`,
                                  "type": "ImageService2",
                                  "profile": "level2"
                              }
                          ]
                      },
                      "type": "Annotation",
                      "target": `https://crkn-iiif-presentation-api.azurewebsites.net/canvas/${canvasNoid}`,
                      "motivation": "painting"
                  }
              ]
          }
      ]
   })
})

// Run the server!
fastify.listen({ port , host: '0.0.0.0' }, function (err, address) {
    if (err) {
      fastify.log.error(err)
      process.exit(1)
    }
    fastify.log.info(`server listening on ${address}`)
})