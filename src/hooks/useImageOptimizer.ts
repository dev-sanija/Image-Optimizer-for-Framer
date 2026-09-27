import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { canCopyImageToClipboard, copyImageToClipboard } from "../utils/clipboard"
import { downloadFile, downloadZip } from "../utils/download"
import { getImageInfo, validateImageFile } from "../utils/imageInfo"
import {
  clampQuality,
  compressionPresets,
  createDefaultSettingsForImage,
  getCompressionPreset,
  normalizeOptimizerSettings,
} from "../utils/presets"
import { optimizeImageFile } from "../utils/optimizer"
import { getCustomDimensions, getResizeDimensions } from "../utils/resize"
import { estimateOptimization } from "../utils/stats"
import { usePersistentState } from "./usePersistentState"
import { useToasts } from "./useToasts"
import type {
  CompressionPresetId,
  ImageMetadata,
  ImageQueueItem,
  OptimizedImageResult,
  OptimizerSettings,
  OutputImageFormat,
  RecentFile,
  ResizeMode,
} from "../types/image"

const settingsStorageKey = "sj-image-optimizer-settings"
const recentFilesStorageKey = "sj-image-optimizer-recents"

export function useImageOptimizer() {
  const [items, setItems] = useState<ImageQueueItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [settings, setSettings] = usePersistentState<OptimizerSettings | null>(settingsStorageKey, null)
  const [recentFiles, setRecentFiles] = usePersistentState<RecentFile[]>(recentFilesStorageKey, [])
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [activeProcessingId, setActiveProcessingId] = useState<string | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)
  const itemsRef = useRef<ImageQueueItem[]>([])
  const { toasts, showToast, dismissToast } = useToasts()

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? items[0] ?? null,
    [items, selectedId],
  )

  const effectiveSettings = useMemo(() => {
    return normalizeOptimizerSettings(settings, selectedItem?.info ?? null)
  }, [selectedItem, settings])

  const itemsWithEstimates = useMemo(() => {
    if (!effectiveSettings) return items

    return items.map((item) => ({
      ...item,
      estimate: estimateOptimization(
        item.info,
        getResizeDimensions(item.info, effectiveSettings.resize),
        effectiveSettings,
      ),
    }))
  }, [effectiveSettings, items])

  const selectedItemWithEstimate = useMemo(
    () => itemsWithEstimates.find((item) => item.id === selectedItem?.id) ?? itemsWithEstimates[0] ?? null,
    [itemsWithEstimates, selectedItem],
  )

  const targetDimensions = useMemo(() => {
    if (!selectedItemWithEstimate || !effectiveSettings) return null
    return getResizeDimensions(selectedItemWithEstimate.info, effectiveSettings.resize)
  }, [effectiveSettings, selectedItemWithEstimate])

  const optimizedFiles = useMemo(
    () => itemsWithEstimates.flatMap((item) => (item.result ? [item.result.file] : [])),
    [itemsWithEstimates],
  )

  const isProcessing = itemsWithEstimates.some((item) => item.status === "processing")
  const globalProgress = useMemo(() => {
    if (itemsWithEstimates.length === 0) return 0
    const total = itemsWithEstimates.reduce((sum, item) => {
      if (item.status === "complete") return sum + 100
      if (item.status === "error") return sum
      return sum + item.progress
    }, 0)
    return Math.round(total / itemsWithEstimates.length)
  }, [itemsWithEstimates])

  const isSvgSelected = selectedItemWithEstimate?.info.format === "svg"
  const transparentPngToJpegWarning =
    selectedItemWithEstimate?.info.format === "png" &&
    selectedItemWithEstimate.info.transparency === "yes" &&
    effectiveSettings?.outputFormat === "jpeg"
      ? "Transparent PNG areas will be flattened to white when exported as JPEG."
      : null

  const loadImages = useCallback(
    async (filesInput: FileList | File[] | null) => {
      const files = Array.from(filesInput ?? [])
      setLastError(null)

      if (files.length === 0) {
        setLastError("No image was selected.")
        showToast("info", "No image was selected.")
        return
      }

      setIsLoadingFiles(true)

      const loadedItems: ImageQueueItem[] = []
      const errors: string[] = []

      try {
        for (const file of files) {
          const validationError = validateImageFile(file)
          if (validationError) {
            errors.push(`${file.name}: ${validationError}`)
            continue
          }

          try {
            const info = await getImageInfo(file)
            const itemSettings = normalizeOptimizerSettings(settings, info) ?? createDefaultSettingsForImage(info)
            const previewUrl = URL.createObjectURL(file)

            loadedItems.push({
              id: createId(),
              file,
              info,
              previewUrl,
              status: "ready",
              progress: 0,
              result: null,
              previousResult: null,
              error:
                info.format === "svg"
                  ? "SVG files can be previewed here, but raster optimization is available for PNG, JPEG, and WEBP images."
                  : null,
              estimate: estimateOptimization(info, getResizeDimensions(info, itemSettings.resize), itemSettings),
            })
          } catch (error) {
            errors.push(`${file.name}: ${error instanceof Error ? error.message : "That image could not be read."}`)
          }
        }

        if (loadedItems.length > 0) {
          setItems((current) => [...current, ...loadedItems])
          setSelectedId((current) => current ?? loadedItems[0].id)
          setSettings((current) => current ?? createDefaultSettingsForImage(loadedItems[0].info))
          showToast("success", `${loadedItems.length} image${loadedItems.length === 1 ? "" : "s"} added to the queue.`)
        }

        if (errors.length > 0) {
          const message = errors.slice(0, 2).join(" ")
          setLastError(message)
          showToast("error", message)
        }
      } finally {
        setIsLoadingFiles(false)
      }
    },
    [setSettings, settings, showToast],
  )

  const removeItem = useCallback((id: string) => {
    setItems((current) => {
      const item = current.find((candidate) => candidate.id === id)
      if (item) revokeItemUrls(item)

      const next = current.filter((candidate) => candidate.id !== id)
      setSelectedId((selected) => (selected === id ? next[0]?.id ?? null : selected))
      return next
    })
  }, [])

  const updateSelectedSettings = useCallback(
    (updater: (current: OptimizerSettings) => OptimizerSettings) => {
      const baseSettings =
        effectiveSettings ??
        (selectedItemWithEstimate ? createDefaultSettingsForImage(selectedItemWithEstimate.info) : null)
      if (!baseSettings) return

      setSettings(updater(baseSettings))
      setItems((current) =>
        current.map((item) => {
          if (!item.result && !item.previousResult) return item

          if (item.result?.previewUrl) URL.revokeObjectURL(item.result.previewUrl)
          if (item.previousResult?.previewUrl) URL.revokeObjectURL(item.previousResult.previewUrl)

          return {
            ...item,
            previousResult: null,
            result: null,
            status: "ready",
            progress: 0,
          }
        }),
      )
    },
    [effectiveSettings, selectedItemWithEstimate, setSettings],
  )

  const setCompressionPreset = useCallback(
    (compressionPreset: CompressionPresetId) => {
      const preset = getCompressionPreset(compressionPreset)
      updateSelectedSettings((current) => ({
        ...current,
        compressionPreset,
        quality: preset.defaultQuality,
      }))
    },
    [updateSelectedSettings],
  )

  const setQuality = useCallback(
    (quality: number) => {
      updateSelectedSettings((current) => ({
        ...current,
        compressionPreset:
          compressionPresets.some(
            (preset) => preset.id === current.compressionPreset && preset.defaultQuality === quality,
          )
            ? current.compressionPreset
            : "manual",
        quality: clampQuality(quality),
      }))
    },
    [updateSelectedSettings],
  )

  const setResizeMode = useCallback(
    (mode: ResizeMode) => {
      updateSelectedSettings((current) => ({
        ...current,
        resize: {
          ...current.resize,
          mode,
        },
      }))
    },
    [updateSelectedSettings],
  )

  const setCustomDimension = useCallback(
    (field: "width" | "height", value: number) => {
      if (!selectedItemWithEstimate) return

      updateSelectedSettings((current) => ({
        ...current,
        resize: {
          ...current.resize,
          mode: "custom",
          ...getCustomDimensions(selectedItemWithEstimate.info, current.resize, field, value),
        },
      }))
    },
    [selectedItemWithEstimate, updateSelectedSettings],
  )

  const setMaintainAspectRatio = useCallback(
    (maintainAspectRatio: boolean) => {
      updateSelectedSettings((current) => ({
        ...current,
        resize: {
          ...current.resize,
          maintainAspectRatio,
        },
      }))
    },
    [updateSelectedSettings],
  )

  const setLockDimensions = useCallback(
    (lockDimensions: boolean) => {
      updateSelectedSettings((current) => ({
        ...current,
        resize: {
          ...current.resize,
          lockDimensions,
        },
      }))
    },
    [updateSelectedSettings],
  )

  const setOutputFormat = useCallback(
    (outputFormat: OutputImageFormat) => {
      updateSelectedSettings((current) => ({
        ...current,
        outputFormat,
      }))
    },
    [updateSelectedSettings],
  )

  const optimizeItem = useCallback(
    async (id: string) => {
      const item = itemsWithEstimates.find((candidate) => candidate.id === id)
      if (!item || !effectiveSettings) return

      if (item.info.format === "svg") {
        showToast("error", "SVG files are preview-only.")
        return
      }

      if (item.info.format === "png" && item.info.transparency === "yes" && effectiveSettings.outputFormat === "jpeg") {
        showToast("info", "Transparent PNG areas will be flattened to white in JPEG.")
      }

      setActiveProcessingId(id)
      setItems((current) =>
        current.map((candidate) =>
          candidate.id === id
            ? { ...candidate, status: "processing", progress: 3, error: null }
            : candidate,
        ),
      )

      try {
        const result = await optimizeImageFile({
          file: item.file,
          info: item.info,
          settings: effectiveSettings,
          dimensions: getResizeDimensions(item.info, effectiveSettings.resize),
          onProgress: (progress) => {
            setItems((current) =>
              current.map((candidate) =>
                candidate.id === id ? { ...candidate, progress } : candidate,
              ),
            )
          },
        })

        setItems((current) =>
          current.map((candidate) => {
            if (candidate.id !== id) return candidate
            if (candidate.previousResult?.previewUrl) URL.revokeObjectURL(candidate.previousResult.previewUrl)

            return {
              ...candidate,
              status: "complete",
              progress: 100,
              previousResult: candidate.result,
              result,
              error: null,
            }
          }),
        )
        setRecentFiles((current) => updateRecentFiles(current, item.info, result))
        showToast("success", `${item.info.name} optimized.`)
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Optimization failed. Try a smaller image or a different output format."
        setItems((current) =>
          current.map((candidate) =>
            candidate.id === id
              ? { ...candidate, status: "error", progress: 0, error: message }
              : candidate,
          ),
        )
        setLastError(message)
        showToast("error", message)
      } finally {
        setActiveProcessingId(null)
      }
    },
    [effectiveSettings, itemsWithEstimates, setRecentFiles, showToast],
  )

  const optimizeSelected = useCallback(async () => {
    if (!selectedItemWithEstimate) {
      showToast("info", "Add an image before optimizing.")
      return
    }
    await optimizeItem(selectedItemWithEstimate.id)
  }, [optimizeItem, selectedItemWithEstimate, showToast])

  const optimizeAll = useCallback(async () => {
    const optimizableItems = itemsWithEstimates.filter((item) => item.info.format !== "svg")
    if (optimizableItems.length === 0) {
      showToast("info", "Add PNG, JPEG, or WEBP images before optimizing.")
      return
    }

    for (const item of optimizableItems) {
      await optimizeItem(item.id)
    }
  }, [itemsWithEstimates, optimizeItem, showToast])

  const retryItem = useCallback(
    async (id: string) => {
      await optimizeItem(id)
    },
    [optimizeItem],
  )

  const downloadSelected = useCallback(() => {
    if (!selectedItemWithEstimate?.result) return

    try {
      downloadFile(selectedItemWithEstimate.result.file)
    } catch {
      showToast("error", "The optimized image could not be downloaded.")
    }
  }, [selectedItemWithEstimate, showToast])

  const downloadAll = useCallback(async () => {
    if (optimizedFiles.length === 0) {
      showToast("info", "Optimize images before downloading a ZIP.")
      return
    }

    try {
      await downloadZip(optimizedFiles)
      showToast("success", "ZIP download prepared.")
    } catch {
      showToast("error", "The ZIP archive could not be prepared.")
    }
  }, [optimizedFiles, showToast])

  const copySelectedToClipboard = useCallback(async () => {
    const file = selectedItemWithEstimate?.result?.file ?? null
    if (!file) return

    try {
      await copyImageToClipboard(file)
      showToast("success", "Optimized image copied to clipboard.")
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Could not copy this image.")
    }
  }, [selectedItemWithEstimate, showToast])

  const undoLastOptimization = useCallback(() => {
    if (!selectedItemWithEstimate?.result) return

    setItems((current) =>
      current.map((item) => {
        if (item.id !== selectedItemWithEstimate.id) return item
        if (item.result?.previewUrl) URL.revokeObjectURL(item.result.previewUrl)
        return {
          ...item,
          result: item.previousResult,
          previousResult: null,
          status: item.previousResult ? "complete" : "ready",
          progress: item.previousResult ? 100 : 0,
        }
      }),
    )
    showToast("info", "Last optimization undone.")
  }, [selectedItemWithEstimate, showToast])

  const replaceSourceWithOptimized = useCallback(() => {
    if (!selectedItemWithEstimate?.result) return

    setItems((current) =>
      current.map((item) => {
        if (item.id !== selectedItemWithEstimate.id || !item.result) return item

        URL.revokeObjectURL(item.previewUrl)
        if (item.previousResult?.previewUrl) URL.revokeObjectURL(item.previousResult.previewUrl)
        return {
          ...item,
          file: item.result.file,
          info: item.result.info,
          previewUrl: item.result.previewUrl,
          status: "ready",
          progress: 0,
          result: null,
          previousResult: null,
          error: null,
        }
      }),
    )
    showToast("success", "Optimized image is now the source for this queue item.")
  }, [selectedItemWithEstimate, showToast])

  const reset = useCallback(() => {
    setItems((current) => {
      current.forEach(revokeItemUrls)
      return []
    })
    setSelectedId(null)
    setLastError(null)
    setActiveProcessingId(null)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const usesModifier = event.metaKey || event.ctrlKey

      if (usesModifier && event.key === "Enter") {
        event.preventDefault()
        void optimizeSelected()
      }

      if (usesModifier && event.shiftKey && event.key.toLowerCase() === "z") {
        event.preventDefault()
        void downloadAll()
      }

      if (usesModifier && event.key.toLowerCase() === "d") {
        event.preventDefault()
        downloadSelected()
      }

      if (usesModifier && event.key.toLowerCase() === "u") {
        event.preventDefault()
        undoLastOptimization()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [downloadAll, downloadSelected, optimizeSelected, undoLastOptimization])

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    return () => {
      itemsRef.current.forEach(revokeItemUrls)
    }
  }, [])

  return {
    items: itemsWithEstimates,
    selectedId: selectedItemWithEstimate?.id ?? null,
    selectedItem: selectedItemWithEstimate,
    settings: effectiveSettings,
    recentFiles,
    targetDimensions,
    globalProgress,
    optimizedFiles,
    isLoadingFiles,
    isProcessing,
    activeProcessingId,
    lastError,
    isSvgSelected,
    transparentPngToJpegWarning,
    toasts,
    canOptimizeSelected: Boolean(selectedItemWithEstimate && selectedItemWithEstimate.info.format !== "svg" && !isProcessing),
    canOptimizeAll: itemsWithEstimates.some((item) => item.info.format !== "svg") && !isProcessing,
    canDownloadSelected: Boolean(selectedItemWithEstimate?.result) && !isProcessing,
    canDownloadAll: optimizedFiles.length > 0 && !isProcessing,
    canCopySelected: canCopyImageToClipboard(selectedItemWithEstimate?.result?.file ?? null) && !isProcessing,
    loadImages,
    selectItem: setSelectedId,
    removeItem,
    retryItem,
    setCompressionPreset,
    setQuality,
    setResizeMode,
    setCustomDimension,
    setMaintainAspectRatio,
    setLockDimensions,
    setOutputFormat,
    optimizeSelected,
    optimizeAll,
    downloadSelected,
    downloadAll,
    copySelectedToClipboard,
    undoLastOptimization,
    replaceSourceWithOptimized,
    reset,
    dismissToast,
  }
}

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function revokeItemUrls(item: ImageQueueItem): void {
  URL.revokeObjectURL(item.previewUrl)
  if (item.result?.previewUrl) URL.revokeObjectURL(item.result.previewUrl)
  if (item.previousResult?.previewUrl) URL.revokeObjectURL(item.previousResult.previewUrl)
}

function updateRecentFiles(
  current: RecentFile[],
  info: ImageMetadata,
  result: OptimizedImageResult,
): RecentFile[] {
  const next: RecentFile = {
    id: createId(),
    name: info.name,
    size: result.info.fileSize,
    format: result.info.format,
    optimizedAt: Date.now(),
    savedPercent: result.savedPercent,
  }

  return [next, ...current.filter((item) => item.name !== info.name)].slice(0, 6)
}
