/*import SwiftClient from 'openstack-swift-client'
const authenticator = new SwiftClient.SwiftAuthenticator(
  `${process.env.SWIFT_SERVER}/auth/v1.0`, 
  `${process.env.SWIFT_ACCOUNT}:${process.env.SWIFT_USER}`, 
  process.env.SWIFT_PASSWORD
)
const client = new SwiftClient(authenticator)*/
import Swift from "client-swift"

let data =  {
  authUrl: `${process.env.SWIFT_SERVER}/auth/v1.0`,
  userName: process.env.SWIFT_USER,
  apiKey: process.env.SWIFT_PASSWORD,
  tenantDomainId: process.env.SWIFT_ACCOUNT
}

console.log(data)

// authenticate and create client instance
 
let client

imageApiStorage()
.then(res => {
  console.log("done", res)
})

/*client.create('access-files').then(res => {
  console.log("created", res)
})*/
// See: https://www.npmjs.com/package/openstack-swift-client
export default async function imageApiStorage() {
  try {
    if(!client) client = await new Swift(data).authenticate()
    // get containers list
    let containers = await client.list()
    console.log(containers)
    /*return {
      accessFiles: client.Container("access-files")
      //accessMetadata: client.container("access-metadata"),
    }*/
  } catch (e) {
    console.log(e)
  }
}