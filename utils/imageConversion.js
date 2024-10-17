import sharp from 'sharp'
// Comprehensive Example: https://github.com/firebase/functions-samples/blob/69b829af5494e7c8104f7f3d10a1496bb773d3e2/image-sharp/functions/index.js
// Sharp Docs: https://sharp.pixelplumbing.com/
export default async function imageConversion(uploadStream) {
    // Convert any input to very high quality JPEG output
    await sharp()
        .jpeg({
            quality: 100,
            chromaSubsampling: '4:4:4'
        })
        .pipe(uploadStream)
    return uploadStream
}