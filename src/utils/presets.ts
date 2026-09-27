import type {
  CompressionPresetId,
  ImageMetadata,
  OptimizerSettings,
  OutputImageFormat,
  ResizeDimensions,
  ResizeMode,
} from "../types/image"

export interface CompressionPreset {
  id: CompressionPresetId
  label: string
  description: string
  defaultQuality: number
  targetRatio: number
}

export interface ResizePreset {
  id: ResizeMode
  label: string
  width: number | null
  height: number | null
}

export const compressionPresets: CompressionPreset[] = [
  {
    id: "maximum-quality",
    label: "Maximum Quality",
    description: "Sharper export with lighter compression",
    defaultQuality: 92,
    targetRatio: 0.82,
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "Best default for Framer websites",
    defaultQuality: 80,
    targetRatio: 0.58,
  },
  {
    id: "smallest-size",
    label: "Smallest Size",
    description: "Aggressive compression for fast loading",
    defaultQuality: 58,
    targetRatio: 0.34,
  },
]

export const resizePresets: ResizePreset[] = [
  { id: "original", label: "Original", width: null, height: null },
  { id: "half", label: "50%", width: null, height: null },
  { id: "quarter", label: "25%", width: null, height: null },
  { id: "instagram-post", label: "Instagram Post", width: 1080, height: 1080 },
  { id: "instagram-story", label: "Instagram Story", width: 1080, height: 1920 },
  { id: "facebook-cover", label: "Facebook Cover", width: 1640, height: 924 },
  { id: "linkedin-banner", label: "LinkedIn Banner", width: 1584, height: 396 },
  { id: "youtube-thumbnail", label: "YouTube Thumbnail", width: 1280, height: 720 },
  { id: "desktop", label: "Desktop", width: 1920, height: 1080 },
  { id: "tablet", label: "Tablet", width: 1280, height: 800 },
  { id: "mobile", label: "Mobile", width: 1080, height: 1920 },
  { id: "4k", label: "4K", width: 3840, height: 2160 },
  { id: "custom", label: "Custom", width: null, height: null },
]

export const availableOutputFormats: OutputImageFormat[] = ["webp", "jpeg", "png"]

export const futureOutputFormats = ["avif"] as const

export function getCompressionPreset(id: CompressionPresetId): CompressionPreset {
  return compressionPresets.find((preset) => preset.id === id) ?? compressionPresets[1]
}

export function getSmartQuality(info: ImageMetadata, settings: OptimizerSettings): number {
  if (settings.compressionPreset === "manual") return settings.quality

  const megapixels = (info.width * info.height) / 1_000_000
  const fileSizeMb = info.fileSize / 1024 / 1024
  const sizeAdjustment = fileSizeMb > 8 ? -6 : fileSizeMb > 3 ? -3 : 0
  const dimensionAdjustment = megapixels > 8 ? -4 : megapixels > 4 ? -2 : 0

  return clampQuality(settings.quality + sizeAdjustment + dimensionAdjustment)
}

export function clampQuality(quality: number): number {
  return Math.max(1, Math.min(100, Math.round(quality)))
}

export function createDefaultSettings(): OptimizerSettings {
  return {
    quality: 80,
    compressionPreset: "balanced",
    resize: {
      mode: "original",
      customWidth: 1,
      customHeight: 1,
      maintainAspectRatio: true,
      lockDimensions: false,
    },
    outputFormat: "webp",
  }
}

export function createDefaultSettingsForImage(info: ImageMetadata): OptimizerSettings {
  const defaults = createDefaultSettings()

  return {
    ...defaults,
    resize: {
      ...defaults.resize,
      customWidth: info.width,
      customHeight: info.height,
    },
  }
}

export function normalizeOptimizerSettings(
  settings: OptimizerSettings | null,
  info: ImageMetadata | null,
): OptimizerSettings | null {
  if (!settings) return info ? createDefaultSettingsForImage(info) : null

  const defaults = info ? createDefaultSettingsForImage(info) : createDefaultSettings()
  const hasKnownPreset = [...compressionPresets, { id: "manual" }].some(
    (preset) => preset.id === settings.compressionPreset,
  )
  const hasKnownFormat = availableOutputFormats.includes(settings.outputFormat)
  const hasKnownResizeMode = resizePresets.some((preset) => preset.id === settings.resize?.mode)

  return {
    ...defaults,
    ...settings,
    compressionPreset: hasKnownPreset ? settings.compressionPreset : defaults.compressionPreset,
    outputFormat: hasKnownFormat ? settings.outputFormat : defaults.outputFormat,
    quality: clampQuality(settings.quality),
    resize: {
      ...defaults.resize,
      ...settings.resize,
      mode: hasKnownResizeMode ? settings.resize.mode : defaults.resize.mode,
      customWidth: normalizeDimension(settings.resize?.customWidth, defaults.resize.customWidth),
      customHeight: normalizeDimension(settings.resize?.customHeight, defaults.resize.customHeight),
      maintainAspectRatio:
        typeof settings.resize?.maintainAspectRatio === "boolean"
          ? settings.resize.maintainAspectRatio
          : defaults.resize.maintainAspectRatio,
      lockDimensions:
        typeof settings.resize?.lockDimensions === "boolean"
          ? settings.resize.lockDimensions
          : defaults.resize.lockDimensions,
    },
  }
}

export function getPresetDimensions(mode: ResizeMode): ResizeDimensions | null {
  const preset = resizePresets.find((item) => item.id === mode)
  if (!preset?.width || !preset.height) return null
  return { width: preset.width, height: preset.height }
}

function normalizeDimension(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback
  return Math.max(1, Math.min(12000, Math.round(value)))
}
