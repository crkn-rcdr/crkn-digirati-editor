const path = require('path')
let electronFs = require('fs')
/**
            "InMagic Identifier" : "objid",
            "CIHM Identifier" : "dc:identifier",
            "Alternate Title" : "dc:title", //(must be the second title column in the record)
            "Volume/Issue" : "dc:title", //(we concatenate this field with the main title field)
            "Issue Date" : "dc:date",
            "Coverage Date" : "dc:coverage",
            "Language" : "dc:language",
            "Place of Publication" : "dc:publisher",
            "Publisher" : "dc:publisher",
            "Publication Date" : "dc:publisher",
            "Local Note" : "dc:description",
            "Source" : "dc:source"
 */
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
    const fileUrl = `${filePath}`// file:// If need fileserver, use: `https://crkn-asset-manager.azurewebsites.net${projectPath}/${fileName}`
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
let getManifestItems = async (wipPath, projectPath, manifestId) => {
  let i = 0
  let manifestItems = []
  electronFs.readdirSync(projectPath).forEach(file => {
      manifestItems.push(getManifestItem(`${projectPath}/${file}`, i))
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
    },
    {
      "label": {
        "en": [
          "InMagic Identifier"
        ]
      },
      "value": {
        "en": [
          "Add InMagic identifier"
        ]
      }
    },
    {
      "label": {
        "en": [
          "CIHM Identifier"
        ]
      },
      "value": {
        "en": [
          "Add CIHM identifier"
        ]
      }
    },
    {
      "label": {
        "en": [
          "Alternate Title"
        ]
      },
      "value": {
        "en": [
          "Add alternative title"
        ]
      }
    },
    {
      "label": {
        "en": [
          "Volume/Issue"
        ]
      },
      "value": {
        "en": [
          "Add volume/issue info"
        ]
      }
    },
    {
      "label": {
        "en": [
          "Issue Date"
        ]
      },
      "value": {
        "en": [
          "Add issue date, ex: 1876 OR 1934-02-23"
        ]
      }
    },
    {
      "label": {
        "en": [
          "Coverage Date"
        ]
      },
      "value": {
        "en": [
          "Add coverage date, ex: 1923/1935 OR 1902-10 OR 1883-01-03/1884-02-22"
        ]
      }
    },
    {
      "label": {
        "en": [
          "Language"
        ]
      },
      "value": {
        "en": [
          "Add language"
        ]
      }
    },
    {
      "label": {
        "en": [
          "Place of Publication"
        ]
      },
      "value": {
        "en": [
          "Add place of publication"
        ]
      }
    },
    {
      "label": {
        "en": [
          "Publisher"
        ]
      },
      "value": {
        "en": [
          "Add publisher"
        ]
      }
    },
    {
      "label": {
        "en": [
          "Publication Date"
        ]
      },
      "value": {
        "en": [
          "Add publication date"
        ]
      }
    },
    // Don't rip this
    {
      "label": {
        "en": [
          "Local Note"
        ]
      },
      "value": {
        "en": [
          "Add local notes"
        ]
      }
    },
    {
      "label": {
        "en": [
          "Source"
        ]
      },
      "value": {
        "en": [
          "Add source"
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
let createManifestFromFiles = async (wipPath, filePaths) => {
  const projectPath = filePaths[0].replace(/\\/g, '/')
  const manifestId = path.basename(projectPath)
  let manifest = newManifest(manifestId, "")
  let i = 0
  let manifestItems = []
  filePaths.forEach(file => {
    manifestItems.push(getManifestItem(file, i))
    i++
  })
  manifest['items'] = manifestItems
  return manifest
}

let createManifest = async (wipPath, projectPath) => {
    const manifestId = path.basename(projectPath)
    let manifest = newManifest(manifestId, manifestId)
    manifest['items'] = await getManifestItems(wipPath, projectPath, manifestId)
    return manifest
}

let replaceManifestCanvasesFromFolder = async (wipPath, projectPath, manifest) => {
  const manifestId = path.basename(projectPath)
  manifest['items'] = await getManifestItems(wipPath, projectPath, manifestId)
  return manifest
}

module.exports = {
    getManifestItem,
    getManifestItems,
    createManifest,
    createManifestFromFiles,
    replaceManifestCanvasesFromFolder
}


    /*{
      "label": {
        "en": [
          "Accessibility Summary"
        ]
      },
      "value": {
        "en": [
          "Add an accessibility summary (Access Mode: Visual. Significant accessibility barriers exist for accessing this content in a non-visual manner.|Access Mode: Visual. Significant accessibility barriers exist for accessing this content in a non-visual manner. Structural navigation and mark up exists to improve use of this content with assistive technology.)"
        ]
      }
    },
    {
      "label": {
        "en": [
          "Accessibility Features"
        ]
      },
      "value": {
        "en": [
          "Add accessbility features (Annotations, Long Descriptions, Table of Contents, Structural Navigation...)"
        ]
      }
    },
    {
      "label": {
        "en": [
          "Destination"
        ]
      },
      "value": {
        "en": [
          "Add destination (Preservation only | Access only | Both Preservation and Access)"
        ]
      }
    },
    {
      "label": {
        "en": [
          "Portal"
        ]
      },
      "value": {
        "en": [
          "Add portal (Canadiana | Heritage | Global Affairs Canada | Nataional Resources Canada | Library of Parlaiment)"
        ]
      }
    },
    {
      "label": {
        "en": [
          "Depositor"
        ]
      },
      "value": {
        "en": [
          "Add depositor (Canadian Research Knowledge Network | University of Alberta, Rutherford Library | Shortgrass Public Library System | Canadian Association of Research Libraries | Musicworks Society of Ontario Inc. | Numeris | Mississauga Library System | Canadiana.org | Department of Foreign Affairs Trade and Development | Canadian Hazards Information Service | Library of Parliament | South Mountain | McGill University Archives | University of Regina Archives | Simon Fraser University)"
        ]
      }
    },*/