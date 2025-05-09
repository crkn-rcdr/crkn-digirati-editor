const path = require('path');
const fs = require('fs').promises;

async function sizeOf(filePath) {
  const buffer = await fs.readFile(filePath);
  if (buffer[0] !== 0xFF || buffer[1] !== 0xD8) {
    throw new Error('Not a valid JPEG file');
  }
  let offset = 2;
  while (offset < buffer.length) {
    const marker = buffer.readUInt16BE(offset);
    if (marker === 0xFFC0 || marker === 0xFFC2) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return { width, height };
    }
    offset += 2 + buffer.readUInt16BE(offset + 2);
  }
  throw new Error('Unable to find image dimensions');
}

const getManifestItem = async (filePath, position) => {
  const dimensions = await sizeOf(filePath);
  const canvasId = `canvas-${encodeURIComponent(filePath)}`;
  const annotPageId = `annotPage-${encodeURIComponent(filePath)}`;
  const annotId = `annot-${encodeURIComponent(filePath)}`;
  const fileUrl = `file://${filePath.replace(/\\/g, '/')}`;

  return {
    id: canvasId,
    type: "Canvas",
    width: dimensions.width,
    height: dimensions.height,
    label: {
      "en": [`Image ${position + 1}`]
    },
    items: [{
      id: annotPageId,
      type: "AnnotationPage",
      items: [{
        id: annotId,
        type: "Annotation",
        motivation: "painting",
        body: {
          id: fileUrl,
          type: "Image",
          format: "image/jpeg",
          width: dimensions.width,
          height: dimensions.height
        },
        target: canvasId
      }]
    }]
  };
};

const getManifestItems = async (filePaths) => {
  return Promise.all(filePaths.map((file, index) => getManifestItem(file, index)));
};

const newManifest = (manifestId, slug) => {
  return {
    "@context": "http://iiif.io/api/presentation/3/context.json",
    "type": "Manifest",
    "id": manifestId,
    "label": {
      "en": ["New Digitization Project Title"]
    },
    "summary": {
      "en": ["Add a simple description"]
    },
    "metadata": [{
      "label": { "en": ["Slug"] },
      "value": { "en": [slug.length ? slug : "Add Slug"] }
    }],
    "items": []
  };
};

const createManifestFromFiles = async (filePaths) => {
  const projectPath = filePaths[0].replace(/\\/g, '/');
  const manifestId = path.basename(projectPath);
  const manifest = newManifest(manifestId, "");
  manifest.items = await getManifestItems(filePaths);
  return manifest;
};

const replaceManifestCanvases = async (filePaths, manifest) => {
  manifest.items = await getManifestItems(filePaths);
  return manifest;
};

module.exports = {
  getManifestItem,
  getManifestItems,
  createManifestFromFiles,
  replaceManifestCanvases
};
