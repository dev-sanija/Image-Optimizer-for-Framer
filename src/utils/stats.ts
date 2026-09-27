import type { ImageMetadata, OptimizationEstimate, OptimizerSettings, ResizeDimensions } from "../types/image"
import { getCompressionPreset, getSmartQuality } from "./presets"

const formatMultipliers = {
  png: 0.92,
  jpeg: 0.58,
  webp: 0.44,
} as const

export function calculateSavedPercent(originalSize: number, optimizedSize: number): number {
  if (originalSize <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((1 - optimizedSize / originalSize) * 100)))
}

export function createLoadImprovementText(savedPercent: number): string {
  if (savedPercent <= 0) return "Similar load time"
  if (savedPercent < 35) return "Modest load improvement"
  if (savedPercent < 70) return "Strong load improvement"
  return "Major load improvement"
}

export function estimateOptimization(
  info: ImageMetadata,
  dimensions: ResizeDimensions,
  settings: OptimizerSettings,
): OptimizationEstimate {
  const resizeRatio = Math.min(1, (dimensions.width * dimensions.height) / (info.width * info.height))
  const preset = getCompressionPreset(settings.compressionPreset)
  const smartQuality = getSmartQuality(info, settings)
  const qualityRatio = smartQuality / 100
  const formatRatio = formatMultipliers[settings.outputFormat]
  const presetRatio = preset.targetRatio
  const estimatedSize = Math.max(
    1024,
    Math.round(info.fileSize * resizeRatio * formatRatio * (0.35 + qualityRatio * 0.8) * presetRatio),
  )
  const savedPercent = calculateSavedPercent(info.fileSize, estimatedSize)
  const compressionRatio = Math.max(1, info.fileSize / estimatedSize)

  return {
    estimatedSize,
    savedPercent,
    compressionRatio,
    loadingImprovement: createLoadImprovementText(savedPercent),
  }
}
