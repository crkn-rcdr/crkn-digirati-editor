const path = require('path')
let electronFs = require('fs')
// Function to get image dimensions (width and height) from a JPEG file
function sizeOf(filePath) {
  const buffer = electronFs.readFileSync(filePath)
  if (buffer[0] !== 0xFF || buffer[1] !== 0xD8) {
    throw new Error('Not a valid JPEG file')
  }
  let offset = 2;
  while (offset < buffer.length) {
    const marker = buffer.readUInt16BE(offset)
    if (marker === 0xFFC0 || marker === 0xFFC2) {
      const height = buffer.readUInt16BE(offset + 5)
      const width = buffer.readUInt16BE(offset + 7)
      return { width, height };
    }
    offset += 2 + buffer.readUInt16BE(offset + 2)
  }
  throw new Error('Unable to find image dimensions')
}
let getManifestItem = (filePath, position) => {
    let canvas = { }
    let annotPage = { }
    let annot = { }
    const dimensions = sizeOf(filePath)
    canvas.id = `canvas-${filePath}`
    canvas.type = "Canvas"
    canvas.width = dimensions.width
    canvas.height = dimensions.height
    canvas.label =  {
      "en": [
        `Image ${position+1}`
      ]
    }
    annotPage.id = `annotPage-${filePath}`
    annotPage.type = "AnnotationPage"
    const fileUrl = `${filePath}`
    annot.id = `annot-${filePath}`
    annot.type = "Annotation"
    annot.motivation = 'painting'
    annot.body = {
      id: 'file://'+fileUrl,
      type: 'Image',
      format: `image/jpeg`, //`image/${ext.replace('.', '')}`,
      width: dimensions.width,
      height: dimensions.height
    }
    annot.target=canvas.id
    annotPage.items = [annot]
    canvas.items = [annotPage]
    return canvas
}
let getManifestItems = async (filePaths) => {
  let i = 0
  let manifestItems = []
  filePaths.forEach(file => {
    manifestItems.push(getManifestItem(file, i))
    i++
  })
  return manifestItems
}
let newManifest = (manifestId, slug) => {
  let metadata =  [
    {
      "label": {
        "en": [
          "Slug"
        ]
      },
      "value": {
        "en": [
          slug.length ? slug : "Add Slug" 
        ]
      }
    }
  ]
  return {
    "@context": "http://iiif.io/api/presentation/3/context.json",
    "type" : "Manifest",
    "id" : manifestId,
    "label" : {
      "en": [
        "New Digitization Project Title"
      ]
    },
    "summary": {
      "en": [
        "Add a simple description"
      ]
    },
    "metadata" : metadata,
    "items": []
  }
}
let createManifestFromFiles = async (filePaths) => {
  const projectPath = filePaths[0].replace(/\\/g, '/')
  const manifestId = path.basename(projectPath)
  let manifest = newManifest(manifestId, "")
  manifest['items'] = await getManifestItems(filePaths)
  return manifest
}
let replaceManifestCanvases= async (filePaths, manifest) => {
  manifest['items'] = await getManifestItems(filePaths)
  return manifest
}
module.exports = {
    getManifestItem,
    getManifestItems,
    createManifestFromFiles,
    replaceManifestCanvases
}