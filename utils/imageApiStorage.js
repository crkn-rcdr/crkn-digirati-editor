import SwiftClient from 'openstack-swift-client'
const authenticator = new SwiftClient.SwiftAuthenticator(
  `${process.env.SWIFT_SERVER}/auth/v1.0`, 
  `${process.env.SWIFT_ACCOUNT}:${process.env.SWIFT_USER}`, 
  process.env.SWIFT_PASSWORD
)
const client = new SwiftClient(authenticator)
/*client.create('access-files').then(res => {
  console.log("created", res)
})*/
// See: https://www.npmjs.com/package/openstack-swift-client
export default function imageApiStorage() {
  return {
    accessFiles: client.container("access-files")
    //accessMetadata: client.container("access-metadata"),
  }
}