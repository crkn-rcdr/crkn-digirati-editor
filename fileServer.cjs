const fastify = require('fastify')({logger: true})
const path = require('node:path')
const pathToWIP = "C:/Users/BrittnyLapierre/OneDrive - Canadian Research Knowledge Network/Documents/WIP"
const port = process.env.PORT || 8000
fastify.register(require('@fastify/static'), {
    root: path.join(pathToWIP),
})
// Run the server!
fastify.listen({ port , host: '0.0.0.0' }, function (err, address) {
    if (err) {
      fastify.log.error(err)
      process.exit(1)
    }
    fastify.log.info(`server listening on ${address}`)
})