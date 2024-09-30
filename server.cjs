const { app, BrowserWindow } = require('electron')
const path = require('path')
const getFolderContentsArray = require('./utilities/getFolderContentsArray.cjs')
const { ipcMain, dialog } = require("electron")
const sizeOf = require("image-size")
const fs = require('fs')
//const { fork } = require('child_process')
//const ps = fork(`${__dirname}/fileServer.cjs`)
//console.log("Fileserver running in the bg: ", ps)
/*
const { download } = import('electron-dl')
*/
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
  const fileUrl = `file://${filePath}`//If need fileserver, use: `http://localhost:8000${projectPath}/${fileName}`
  annot.id = `annot-${filePath}`
  annot.type = "Annotation"
  annot.motivation = 'painting'
  annot.body = {
    id: fileUrl,
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
let getManifestItems = (files) => {
  let manifestItems = []
  let i = 0
  for (let filePath of files ) {
    manifestItems.push(getManifestItem(filePath, i))
    i++
  }
  return manifestItems
}
let getManifest = (projectPath) => {
  let files = getFolderContentsArray(projectPath) //pathToWIP + 
  const manifestId = "Digitization Project" ///+ path.basename(projectPath)
  let manifest = {
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
    "metadata" : [
      {
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
            "Add depositor (University of Alberta, Rutherford Library | Shortgrass Public Library System | Canadian Association of Research Libraries | Musicworks Society of Ontario Inc. | Numeris | Mississauga Library System | Canadiana.org | Department of Foreign Affairs Trade and Development | Canadian Hazards Information Service | Library of Parliament | South Mountain | McGill University Archives | University of Regina Archives | Simon Fraser University)"
          ]
        }
      },
      {
        "label": {
          "en": [
            "Slug"
          ]
        },
        "value": {
          "en": [
            "Add a slug"
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
      // LABEL
      /* {
        "label": {
          "en": [
            "Title"
          ]
        },
        "value": {
          "en": [
            "Add title"
          ]
        }
      }, */
      {
        "label": {
          "en": [
            "Alternate Title"
          ]
        },
        "value": {
          "en": [
            "Add alternaitve title"
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
            "Add "
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
            "Add issue date"
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
            "Number of Pages "
          ]
        },
        "value": {
          "en": [
            "Add number of pages"
          ]
        }
      },
      {
        "label": {
          "en": [
            "Number of Images"
          ]
        },
        "value": {
          "en": [
            "Add number of images"
          ]
        }
      },
      {
        "label": {
          "en": [
            "LIBR Source Code"
          ]
        },
        "value": {
          "en": [
            "Add LIBR source code"
          ]
        }
      },
      {
        "label": {
          "en": [
            "Dots Per Inch"
          ]
        },
        "value": {
          "en": [
            "Add dots per inch"
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
      },
      {
        "label": {
          "en": [
            "Scan Date"
          ]
        },
        "value": {
          "en": [
            "Add scan date"
          ]
        }
      }
    ],
    "items": []
  }
  // Check if save file exists
  const manifestCache = path.join(path.dirname(projectPath),'.manifest.json')
  if(fs.existsSync(manifestCache)) {
    manifest = JSON.parse(fs.readFileSync(manifestCache, 'utf-8'))
  }
  manifest['items'] = getManifestItems(files)
    
  return manifest
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  
  ipcMain.handle("saveManifestJSON", async (event, data) => {
    const folderPath = path.dirname(data['items'][0]['id'].replace("canvas-", ''))
    const projectPath = path.dirname(folderPath)
    const pathToSaveTo = path.join(projectPath,'.manifest.json')
    // Handle any image re-ordering. 
    // 1. Rename source images while handling duplicates.
    let i = 0
    for(let item of data['items']) { 
      const fileName = item['id'].replace("canvas-", '')
      const ext = path.extname(fileName)
      const newFileName = path.join( path.dirname(fileName), "tmp."+(i+1).toString().padStart(4, '0')+ext )
      fs.renameSync( fileName, newFileName )
      i++
    }
    let files = getFolderContentsArray(folderPath) 
    i = 0
    for(let filePath of files) { 
      const newFileName = filePath.replace("tmp.", '')
      fs.renameSync( filePath, newFileName )
      i++
    }
    //Write
    fs.writeFileSync(pathToSaveTo, JSON.stringify(data), 'utf-8') 

    return data
  })

  ipcMain.handle("createManifest", async (event) => {
    const handler = await dialog.showOpenDialog({properties: ['openDirectory']})
    if(!handler.filePaths[0]) return
    const folderPath = handler.filePaths[0].replace(/\\/g, '/')
    return getManifest(folderPath)
  })

  win.loadFile( path.join(__dirname, '/dist/index.html') )
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})