import type { ImageMetadata, SourceImageFormat, TransparencyStatus } from "../types/image"

const supportedFormats: Record<string, SourceImageFormat> = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
}

const extensionFormats: Record<string, SourceImageFormat> = {
  png: "png",
  jpg: "jpeg",
  jpeg: "jpeg",
  webp: "webp",
  svg: "svg",
}

export const maxFileSizeBytes = 50 * 1024 * 1024

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"

  const units = ["B", "KB", "MB", "GB"]
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index

  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`
}

export function getImageFormat(file: File): SourceImageFormat | null {
  const mimeType = file.type.toLowerCase()
  const mimeFormat = supportedFormats[mimeType]
  if (mimeFormat) return mimeFormat

  if (mimeType && mimeType !== "application/octet-stream") {
    return null
  }

  const extension = file.name.split(".").pop()?.toLowerCase()
  return extension ? extensionFormats[extension] ?? null : null
}

export function validateImageFile(file: File): string | null {
  if (file.size <= 0) {
    return "This file is empty. Choose a valid image."
  }

  if (!getImageFormat(file)) {
    return "Please choose PNG, JPEG, WEBP, or SVG images."
  }

  if (file.size > maxFileSizeBytes) {
    return `One image is larger than ${formatBytes(maxFileSizeBytes)}. Try a smaller file for reliable browser optimization.`
  }

  return null
}

export async function getImageInfo(file: File): Promise<ImageMetadata> {
  const format = getImageFormat(file)
  if (!format) {
    throw new Error("Unsupported image format.")
  }

  const objectUrl = URL.createObjectURL(file)

  try {
    const [dimensions, binary] = await Promise.all([
      loadImageDimensions(objectUrl),
      file.arrayBuffer(),
    ])
    const technical = readTechnicalMetadata(binary, format)
    const transparency = await detectTransparency(file, format, objectUrl)

    return {
      name: file.name,
      width: dimensions.width,
      height: dimensions.height,
      format,
      mimeType: file.type || mimeTypeForFormat(format),
      fileSize: file.size,
      aspectRatio: createAspectRatio(dimensions.width, dimensions.height),
      transparency,
      colorSpace: technical.colorSpace,
      dpi: technical.dpi,
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export function formatImageFormat(format: SourceImageFormat): string {
  if (format === "jpeg") return "JPEG"
  return format.toUpperCase()
}

function mimeTypeForFormat(format: SourceImageFormat): string {
  if (format === "jpeg") return "image/jpeg"
  if (format === "svg") return "image/svg+xml"
  return `image/${format}`
}

function loadImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const width = image.naturalWidth
      const height = image.naturalHeight

      if (width <= 0 || height <= 0) {
        reject(new Error("This image does not expose valid dimensions."))
        return
      }

      resolve({ width, height })
    }
    image.onerror = () => reject(new Error("The image could not be read."))
    image.src = src
  })
}

async function detectTransparency(
  file: File,
  format: SourceImageFormat,
  objectUrl: string,
): Promise<TransparencyStatus> {
  if (format === "jpeg") return "no"
  if (format === "svg") return "unknown"
  if (format !== "png" && format !== "webp") return "unknown"

  const image = await loadImageElement(objectUrl)
  const sampleWidth = Math.min(image.naturalWidth, 160)
  const sampleHeight = Math.min(image.naturalHeight, 160)
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d", { willReadFrequently: true })

  if (!context || sampleWidth <= 0 || sampleHeight <= 0 || file.size > maxFileSizeBytes) {
    return "unknown"
  }

  canvas.width = sampleWidth
  canvas.height = sampleHeight
  context.drawImage(image, 0, 0, sampleWidth, sampleHeight)

  try {
    const pixels = context.getImageData(0, 0, sampleWidth, sampleHeight).data
    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] < 255) return "yes"
    }
    return "no"
  } catch {
    return "unknown"
  }
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("The image could not be sampled."))
    image.src = src
  })
}

function createAspectRatio(width: number, height: number): string {
  const divisor = greatestCommonDivisor(width, height)
  return `${Math.round(width / divisor)}:${Math.round(height / divisor)}`
}

function greatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(left)
  let b = Math.abs(right)

  while (b > 0) {
    const remainder = a % b
    a = b
    b = remainder
  }

  return a || 1
}

function readTechnicalMetadata(
  buffer: ArrayBuffer,
  format: SourceImageFormat,
): { colorSpace: string | null; dpi: number | null } {
  if (format === "png") return readPngTechnicalMetadata(buffer)
  if (format === "jpeg") return readJpegTechnicalMetadata(buffer)
  if (format === "webp") return { colorSpace: "sRGB", dpi: null }
  return { colorSpace: null, dpi: null }
}

function readPngTechnicalMetadata(buffer: ArrayBuffer): { colorSpace: string | null; dpi: number | null } {
  const bytes = new Uint8Array(buffer)
  let offset = 8
  let colorSpace: string | null = null
  let dpi: number | null = null

  while (offset + 12 <= bytes.length) {
    const length = readUint32(bytes, offset)
    const type = readAscii(bytes, offset + 4, 4)
    const dataStart = offset + 8

    if (type === "sRGB") colorSpace = "sRGB"
    if (type === "iCCP") colorSpace = "ICC profile"
    if (type === "pHYs" && dataStart + 9 <= bytes.length) {
      const pixelsPerMeterX = readUint32(bytes, dataStart)
      const unit = bytes[dataStart + 8]
      if (unit === 1 && pixelsPerMeterX > 0) {
        dpi = Math.round(pixelsPerMeterX * 0.0254)
      }
    }

    offset += length + 12
  }

  return { colorSpace, dpi }
}

function readJpegTechnicalMetadata(buffer: ArrayBuffer): { colorSpace: string | null; dpi: number | null } {
  const bytes = new Uint8Array(buffer)
  let offset = 2
  let colorSpace: string | null = "sRGB"
  let dpi: number | null = null

  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return { colorSpace: null, dpi: null }
  }

  while (offset + 4 < bytes.length) {
    if (bytes[offset] !== 0xff) break

    const marker = bytes[offset + 1]
    const length = (bytes[offset + 2] << 8) + bytes[offset + 3]
    const dataStart = offset + 4

    if (marker === 0xe0 && readAscii(bytes, dataStart, 5) === "JFIF\0") {
      const units = bytes[dataStart + 7]
      const xDensity = (bytes[dataStart + 8] << 8) + bytes[dataStart + 9]
      if (units === 1) dpi = xDensity
      if (units === 2) dpi = Math.round(xDensity * 2.54)
    }

    if (marker === 0xe2 && readAscii(bytes, dataStart, 11) === "ICC_PROFILE") {
      colorSpace = "ICC profile"
    }

    offset += length + 2
  }

  return { colorSpace, dpi }
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] * 256 ** 3 +
    bytes[offset + 1] * 256 ** 2 +
    bytes[offset + 2] * 256 +
    bytes[offset + 3]
  )
}

function readAscii(bytes: Uint8Array, start: number, length: number): string {
  let value = ""
  for (let index = start; index < start + length && index < bytes.length; index += 1) {
    value += String.fromCharCode(bytes[index])
  }
  return value
}
