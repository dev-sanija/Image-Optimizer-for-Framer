export type SourceImageFormat = "png" | "jpeg" | "webp" | "svg"

export type OutputImageFormat = "png" | "jpeg" | "webp"

export type FutureOutputImageFormat = OutputImageFormat | "avif"

export type ResizeMode =
  | "original"
  | "half"
  | "quarter"
  | "custom"
  | "instagram-post"
  | "instagram-story"
  | "facebook-cover"
  | "linkedin-banner"
  | "youtube-thumbnail"
  | "desktop"
  | "tablet"
  | "mobile"
  | "4k"

export type CompressionPresetId = "maximum-quality" | "balanced" | "smallest-size" | "manual"

export type OptimizerStatus = "idle" | "ready" | "processing" | "complete" | "error"

export type TransparencyStatus = "yes" | "no" | "unknown"

export interface ImageMetadata {
  name: string
  width: number
  height: number
  format: SourceImageFormat | OutputImageFormat
  mimeType: string
  fileSize: number
  aspectRatio: string
  transparency: TransparencyStatus
  colorSpace: string | null
  dpi: number | null
}

export interface ResizeOptions {
  mode: ResizeMode
  customWidth: number
  customHeight: number
  maintainAspectRatio: boolean
  lockDimensions: boolean
}

export interface OptimizerSettings {
  quality: number
  compressionPreset: CompressionPresetId
  resize: ResizeOptions
  outputFormat: OutputImageFormat
}

export interface OptimizedImageResult {
  file: File
  previewUrl: string
  info: ImageMetadata
  savedPercent: number
  compressionRatio: number
  estimatedLoadImprovement: string
}

export interface ResizeDimensions {
  width: number
  height: number
}

export interface OptimizationEstimate {
  estimatedSize: number
  savedPercent: number
  compressionRatio: number
  loadingImprovement: string
}

export interface ImageQueueItem {
  id: string
  file: File
  info: ImageMetadata
  previewUrl: string
  status: OptimizerStatus
  progress: number
  result: OptimizedImageResult | null
  previousResult: OptimizedImageResult | null
  error: string | null
  estimate: OptimizationEstimate
}

export interface RecentFile {
  id: string
  name: string
  size: number
  format: SourceImageFormat | OutputImageFormat
  optimizedAt: number
  savedPercent: number
}

export type ToastTone = "success" | "error" | "info"

export interface ToastMessage {
  id: string
  tone: ToastTone
  message: string
}
