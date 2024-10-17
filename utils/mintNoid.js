
export default async function mintNoid(type) {
  const url = `${process.env.NOID_SERVER}/mint/1/${type}`
  let jsonData = await (await fetch(url, { method: 'POST' })).json()
  return jsonData['ids'][0]
}