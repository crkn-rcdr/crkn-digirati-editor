import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import fastifyMultipart from '@fastify/multipart'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pipeline } from 'node:stream/promises'
import imageApiStorage from './utils/imageApiStorage.js'
import imageConversion from './utils/imageConversion.js'
import imageMetadata from './utils/imageMetadata.js'
import getStreamMd5 from './utils/getStreamMd5.js'
import createCanvasInCouch from './utils/createCanvasInCouch.js'

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
fastify.register(fastifyMultipart)


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
  const data = await req.file()
  console.log(data)
  /*
  data.file // stream
  data.fields // other parsed parts
  data.fieldname
  data.filename
  data.encoding
  data.mimetype
  */
  const portalHost = 'www.canadiana.ca'
  const sequenceNum = 1
  const slug = 'britt2'

  // Decrease quality
  let stream = await pipeline(data.file, fs.createWriteStream(data.filename))
  stream = await imageConversion(stream)

  // Create records in swift and database
  const canvasNoid = mintNoid('canvas')
  let swiftResult = await imageApiStorageClient.accessFiles.create(canvasNoid, stream)
  console.log(swiftResult)
  let imageInfo = await imageMetadata(stream)
  let md5 = await getStreamMd5(stream)
  let couchResult = createCanvasInCouch(
    canvasNoid, 
    imageInfo.height, 
    imageInfo.width, 
    imageInfo.size, 
    md5
  )
  console.log(couchResult)

  // Return remote canvas info
  const encodedNoid = encodeURIComponent(canvasNoid)
  reply.send({
    "id" : `https://${portalHost}/iiif/${slug}/canvas/p${sequenceNum}`, // Todo: this will need to change when you get an example of the stand alone API
    "width" : imageInfo.width,
    "height" : imageInfo.height,
    "items" : [
       {
          "id" : `https://${portalHost}/iiif/${slug}/page/p${sequenceNum}/main1`,
          "items" : [
             {
                "body" : {
                   "format" : "image/jpeg",
                   "height" : imageInfo.height,
                   "id" : `https://image-tor.canadiana.ca/iiif/2/${encodedNoid}/full/max/0/default.jpg`,
                   "service" : [
                      {
                         "id" : `https://image-tor.canadiana.ca/iiif/2/${encodedNoid}`,
                         "profile" : "level2",
                         "type" : "ImageService2"
                      }
                   ],
                   "type" : "Image",
                   "width" : imageInfo.width
                },
                "id" : `https://${portalHost}/iiif/${slug}/annotation/p${sequenceNum}/image`,
                "motivation" : "painting",
                "target" : `https://${portalHost}/iiif/${slug}/canvas/p${sequenceNum}`,
                "type" : "Annotation"
             }
          ],
          "type" : "AnnotationPage"
       }
    ],
    "thumbnail" : [
       {
          "format" : "image/jpeg",
          "id" : `https://image-uab.canadiana.ca/iiif/2/${encodedNoid}/full/max/0/default.jpg`,
          "type" : "Image"
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