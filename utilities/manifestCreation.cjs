const path = require('path');
const fs = require('fs').promises;

async function sizeOf(filePath) {
  const handle = await fs.open(filePath);
  try {
    const { size } = await handle.stat();
    const bytesToRead = Math.min(1024 * 64, size); // Read first 64KB
    const buffer = Buffer.alloc(bytesToRead);
    await handle.read(buffer, 0, bytesToRead, 0);

    if (buffer[0] !== 0xFF || buffer[1] !== 0xD8) {
      throw new Error('Not a valid JPEG file');
    }

    let offset = 2;
    let orientation = 1;
    let width = null;
    let height = null;

    while (offset < buffer.length) {
      if (buffer[offset] !== 0xFF) break;

      const marker = buffer.readUInt16BE(offset);
      const length = buffer.readUInt16BE(offset + 2);

      // EXIF (APP1) segment
      if (marker === 0xFFE1) {
        const exifHeader = buffer.toString('ascii', offset + 4, offset + 10);
        if (exifHeader === 'Exif\0\0') {
          const tiffOffset = offset + 10;
          const isLittleEndian = buffer.toString('ascii', tiffOffset, tiffOffset + 2) === 'II';
          const readUInt16 = (buf, pos) =>
            isLittleEndian ? buf.readUInt16LE(pos) : buf.readUInt16BE(pos);
          const readUInt32 = (buf, pos) =>
            isLittleEndian ? buf.readUInt32LE(pos) : buf.readUInt32BE(pos);

          const ifdOffset = readUInt32(buffer, tiffOffset + 4);
          const ifdStart = tiffOffset + ifdOffset;
          const entries = readUInt16(buffer, ifdStart);

          for (let i = 0; i < entries; i++) {
            const entryOffset = ifdStart + 2 + i * 12;
            const tag = readUInt16(buffer, entryOffset);
            if (tag === 0x0112) {
              orientation = readUInt16(buffer, entryOffset + 8);
              break;
            }
          }
        }
      }

      // SOF marker — get width/height
      if (marker === 0xFFC0 || marker === 0xFFC2) {
        height = buffer.readUInt16BE(offset + 5);
        width = buffer.readUInt16BE(offset + 7);
      }

      offset += 2 + length;
    }

    if (width == null || height == null) {
      throw new Error('Unable to find image dimensions');
    }

    // Adjust based on EXIF orientation
    if ([5, 6, 7, 8].includes(orientation)) {
      [width, height] = [height, width]; // Swap width and height
    }

    console.log({ width, height, orientation })
    return { width, height, orientation };
  } finally {
    await handle.close();
  }
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


/**
 * 
let imagePromises = [];
imagePromises.push(async () => { ... read the image size here ... });
 */
const getManifestItems = async (filePaths) => {
  return Promise.all(filePaths.map((file, index) => getManifestItem(file, index)));
};

const newManifest = (manifestId, slug) => {
  return {
    "@context": "http://iiif.io/api/presentation/3/context.json",
    "type": "Manifest",
    "id": manifestId,
    "label": {
      "en": [""]
    },
    "summary": {
      "en": [""]
    },
    "metadata": [{
      "label": { "en": ["Slug"] },
      "value": { "en": [slug.length ? slug : ""] }
    }],
    "items": []
  };
};

const createManifestFromFiles = async (filePaths) => {
  const projectPath = filePaths[0].replace(/\\/g, '/');
  const manifestId = path.basename(projectPath);
  const manifest = newManifest(manifestId, "");
  manifest.items = await getManifestItems(filePaths); // await Promise.all(imagePromises); // Will batch the file system reads.
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
