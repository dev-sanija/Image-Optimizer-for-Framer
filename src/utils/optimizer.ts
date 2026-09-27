import { compressImage } from "./compress"
import { convertImageFile, extensionForOutput, mimeTypeForOutput } from "./convert"
import { getImageInfo } from "./imageInfo"
import { getSmartQuality } from "./presets"
import { calculateSavedPercent, createLoadImprovementText } from "./stats"
import type {
  ImageMetadata,
  OptimizedImageResult,
  OptimizerSettings,
  ResizeDimensions,
} from "../types/image"

interface OptimizeImageOptions {
  file: File
  info: ImageMetadata
  settings: OptimizerSettings
  dimensions: ResizeDimensions
  onProgress: (progress: number) => void
}

export async function optimizeImageFile({
  file,
  info,
  settings,
  dimensions,
  onProgress,
}: OptimizeImageOptions): Promise<OptimizedImageResult> {
  if (info.format === "svg") {
    throw new Error("SVG files are preview-only. Upload PNG, JPEG, or WEBP images to optimize.")
  }

  const effectiveQuality = getSmartQuality(info, settings)
  const outputName = createOptimizedFileName(file.name, settings.outputFormat)
  const needsCanvasStep =
    dimensions.width !== info.width ||
    dimensions.height !== info.height ||
    settings.outputFormat !== info.format

  onProgress(8)

  const preparedFile = needsCanvasStep
    ? await convertImageFile(file, dimensions, settings.outputFormat, effectiveQuality, outputName)
    : new File([file], outputName, {
        type: mimeTypeForOutput(settings.outputFormat),
        lastModified: Date.now(),
      })

  onProgress(18)

  const compressedFile = await compressImage(preparedFile, {
    quality: effectiveQuality,
    outputFormat: settings.outputFormat,
    onProgress: (compressionProgress) => {
      onProgress(18 + Math.round(compressionProgress * 0.76))
    },
  })

  const optimizedFile =
    compressedFile.size <= preparedFile.size
      ? new File([compressedFile], outputName, {
          type: compressedFile.type || mimeTypeForOutput(settings.outputFormat),
          lastModified: Date.now(),
        })
      : new File([preparedFile], outputName, {
          type: preparedFile.type,
          lastModified: Date.now(),
        })

  const optimizedInfo = await getImageInfo(optimizedFile)
  const previewUrl = URL.createObjectURL(optimizedFile)
  const savedPercent = calculateSavedPercent(file.size, optimizedFile.size)
  const compressionRatio = Math.max(1, file.size / optimizedFile.size)

  onProgress(100)

  return {
    file: optimizedFile,
    previewUrl,
    info: optimizedInfo,
    savedPercent,
    compressionRatio,
    estimatedLoadImprovement: createLoadImprovementText(savedPercent),
  }
}

export function createOptimizedFileName(fileName: string, format: OptimizerSettings["outputFormat"]): string {
  const baseName = fileName.replace(/\.[^/.]+$/, "") || "image"
  return `${baseName}-optimized.${extensionForOutput(format)}`
}
