import type { ImageMetadata, ResizeDimensions, ResizeOptions } from "../types/image"
import { getPresetDimensions } from "./presets"

export function getResizeDimensions(info: ImageMetadata, resize: ResizeOptions): ResizeDimensions {
  if (resize.mode === "half") {
    return normalizeDimensions({
      width: info.width * 0.5,
      height: info.height * 0.5,
    })
  }

  if (resize.mode === "quarter") {
    return normalizeDimensions({
      width: info.width * 0.25,
      height: info.height * 0.25,
    })
  }

  const presetDimensions = getPresetDimensions(resize.mode)
  if (presetDimensions) {
    return fitWithinPreset(info, presetDimensions, resize.maintainAspectRatio)
  }

  if (resize.mode === "custom") {
    return normalizeDimensions({
      width: resize.customWidth,
      height: resize.customHeight,
    })
  }

  return { width: info.width, height: info.height }
}

export function getCustomDimensions(
  info: ImageMetadata,
  current: ResizeOptions,
  changedField: "width" | "height",
  value: number,
): Pick<ResizeOptions, "customWidth" | "customHeight"> {
  const safeValue = clampDimension(value)

  if (!current.maintainAspectRatio || current.lockDimensions) {
    return changedField === "width"
      ? { customWidth: safeValue, customHeight: current.customHeight }
      : { customWidth: current.customWidth, customHeight: safeValue }
  }

  const aspectRatio = info.width / info.height

  if (changedField === "width") {
    return {
      customWidth: safeValue,
      customHeight: clampDimension(Math.round(safeValue / aspectRatio)),
    }
  }

  return {
    customWidth: clampDimension(Math.round(safeValue * aspectRatio)),
    customHeight: safeValue,
  }
}

export function clampDimension(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.max(1, Math.min(12000, Math.round(value)))
}

function fitWithinPreset(
  info: ImageMetadata,
  preset: ResizeDimensions,
  maintainAspectRatio: boolean,
): ResizeDimensions {
  if (!maintainAspectRatio) return preset

  const ratio = Math.min(preset.width / info.width, preset.height / info.height)
  return normalizeDimensions({
    width: info.width * ratio,
    height: info.height * ratio,
  })
}

function normalizeDimensions(dimensions: ResizeDimensions): ResizeDimensions {
  return {
    width: clampDimension(dimensions.width),
    height: clampDimension(dimensions.height),
  }
}
