import sharp from 'sharp'
// Comprehensive Example: https://github.com/lovell/sharp/issues/776
// Sharp Docs: https://sharp.pixelplumbing.com/api-input#metadata
export default async function imageMetadata(stream) {
    const metaReader = await sharp().metadata()
    const imageInfo = stream.pipe(metaReader)
    return imageInfo
}
