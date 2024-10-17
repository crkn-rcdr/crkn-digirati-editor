
export default async function mintNoid(type) {
  const url = `${process.env.NOID_SERVER}/mint/1/${type}`
  let jsonData = await (await fetch(url)).json()
  return noid_id = jsonData['ids'][0]
}