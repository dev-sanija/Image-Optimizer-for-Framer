import imageCompression from "browser-image-compression"
import type { OutputImageFormat } from "../types/image"
import { mimeTypeForOutput } from "./convert"

interface CompressOptions {
  quality: number
  outputFormat: OutputImageFormat
  onProgress: (progress: number) => void
}

export async function compressImage(file: File, options: CompressOptions): Promise<File> {
  const qualityRatio = options.quality / 100
  const originalSizeMb = file.size / 1024 / 1024
  const maxSizeMb = Math.max(0.04, originalSizeMb * Math.max(0.08, qualityRatio))

  const compressedBlob = await imageCompression(file, {
    alwaysKeepResolution: true,
    fileType: mimeTypeForOutput(options.outputFormat),
    initialQuality: qualityRatio,
    maxIteration: 12,
    maxSizeMB: maxSizeMb,
    onProgress: options.onProgress,
    useWebWorker: true,
  })

  return new File([compressedBlob], file.name, {
    type: compressedBlob.type || mimeTypeForOutput(options.outputFormat),
    lastModified: Date.now(),
  })
}
