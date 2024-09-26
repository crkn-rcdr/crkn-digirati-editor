import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const fastify = Fastify({
  logger: true
})

fastify.register(fastifyStatic, {
    root: path.join(__dirname, 'dist'),
})

fastify.get('/', function (req, reply) {
  reply.sendFile('index.html')
})

// Run the server!
fastify.listen({ port: 8000 , host: '0.0.0.0' }, function (err, address) {
    if (err) {
      fastify.log.error(err)
      process.exit(1)
    }
    fastify.log.info(`server listening on ${address}`)
})