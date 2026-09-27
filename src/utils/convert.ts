import type { OutputImageFormat, ResizeDimensions } from "../types/image"

export function mimeTypeForOutput(format: OutputImageFormat): string {
  if (format === "jpeg") return "image/jpeg"
  return `image/${format}`
}

export function extensionForOutput(format: OutputImageFormat): string {
  if (format === "jpeg") return "jpg"
  return format
}

export function formatOutputLabel(format: OutputImageFormat): string {
  if (format === "jpeg") return "JPEG"
  return format.toUpperCase()
}

export async function convertImageFile(
  file: File,
  dimensions: ResizeDimensions,
  format: OutputImageFormat,
  quality: number,
  outputName: string,
): Promise<File> {
  const image = await loadImage(file)
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("Your browser could not prepare the image canvas.")
  }

  canvas.width = dimensions.width
  canvas.height = dimensions.height

  if (format === "jpeg") {
    context.fillStyle = "#ffffff"
    context.fillRect(0, 0, canvas.width, canvas.height)
  }

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = "high"
  context.drawImage(image, 0, 0, dimensions.width, dimensions.height)

  const blob = await canvasToBlob(canvas, mimeTypeForOutput(format), quality / 100)
  return new File([blob], outputName, { type: blob.type, lastModified: Date.now() })
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error("The image could not be loaded for conversion."))
    }

    image.src = objectUrl
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("The optimized image could not be generated."))
          return
        }

        resolve(blob)
      },
      mimeType,
      quality,
    )
  })
}
