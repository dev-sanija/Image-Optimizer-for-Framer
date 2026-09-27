import { framer } from "@framer/plugin"
import { lazy, Suspense } from "react"
import { ActionButtons } from "./components/ActionButtons"
import { CompressionSettings } from "./components/CompressionSettings"
import { FormatSelector } from "./components/FormatSelector"
import { Header } from "./components/Header"
import { ImageInfo } from "./components/ImageInfo"
import { ProgressBar } from "./components/ProgressBar"
import { QueueList } from "./components/QueueList"
import { RecentFiles } from "./components/RecentFiles"
import { ResizeSettings } from "./components/ResizeSettings"
import { StatsGrid } from "./components/StatsGrid"
import { ToastStack } from "./components/ToastStack"
import { UploadArea } from "./components/UploadArea"
import { useImageOptimizer } from "./hooks/useImageOptimizer"
import "./styles/app.css"

const ComparisonSlider = lazy(() =>
  import("./components/ComparisonSlider").then((module) => ({ default: module.ComparisonSlider })),
)

framer.showUI({
  position: "top right",
  width: 480,
  height: 760,
})

export function App() {
  const optimizer = useImageOptimizer()
  const selected = optimizer.selectedItem
  const hasImages = optimizer.items.length > 0

  return (
    <main className="app-shell">
      <Header onReset={optimizer.reset} hasImages={hasImages} />

      <UploadArea onFilesSelect={optimizer.loadImages} disabled={optimizer.isLoadingFiles || optimizer.isProcessing} />

      {optimizer.lastError ? (
        <div className="message-card" role="alert">
          {optimizer.lastError}
        </div>
      ) : null}

      <ProgressBar
        progress={optimizer.globalProgress}
        visible={optimizer.isProcessing || optimizer.isLoadingFiles}
        label={optimizer.isLoadingFiles ? "Reading images" : "Batch progress"}
      />

      <QueueList
        items={optimizer.items}
        selectedId={optimizer.selectedId}
        activeProcessingId={optimizer.activeProcessingId}
        onSelect={optimizer.selectItem}
        onRemove={optimizer.removeItem}
        onRetry={optimizer.retryItem}
      />

      {selected && optimizer.settings ? (
        <>
          <Suspense fallback={<div className="panel skeleton-card" aria-hidden="true" />}>
            <ComparisonSlider item={selected} />
          </Suspense>

          <ImageInfo info={selected.info} />

          <section className="workflow-section" aria-labelledby="settings-heading">
            <div className="section-heading">
              <span>Optimization Settings</span>
              <strong id="settings-heading">Tune output</strong>
            </div>
            <div className="settings-stack">
            <CompressionSettings
              preset={optimizer.settings.compressionPreset}
              quality={optimizer.settings.quality}
              estimate={selected.estimate}
              disabled={optimizer.isProcessing || optimizer.isSvgSelected}
              onPresetChange={optimizer.setCompressionPreset}
              onQualityChange={optimizer.setQuality}
            />
            <ResizeSettings
              info={selected.info}
              resize={optimizer.settings.resize}
              targetDimensions={optimizer.targetDimensions}
              disabled={optimizer.isProcessing || optimizer.isSvgSelected}
              onModeChange={optimizer.setResizeMode}
              onCustomDimensionChange={optimizer.setCustomDimension}
              onMaintainAspectRatioChange={optimizer.setMaintainAspectRatio}
              onLockDimensionsChange={optimizer.setLockDimensions}
            />
            <FormatSelector
              value={optimizer.settings.outputFormat}
              disabled={optimizer.isProcessing}
              isSvg={optimizer.isSvgSelected}
              warning={optimizer.transparentPngToJpegWarning}
              onChange={optimizer.setOutputFormat}
            />
            </div>
          </section>

          <StatsGrid item={selected} />

          <ActionButtons
            canOptimize={optimizer.canOptimizeSelected}
            canOptimizeAll={optimizer.canOptimizeAll}
            canDownload={optimizer.canDownloadSelected}
            canDownloadAll={optimizer.canDownloadAll}
            canCopy={optimizer.canCopySelected}
            canUndo={Boolean(selected.result)}
            isProcessing={optimizer.isProcessing}
            onOptimize={optimizer.optimizeSelected}
            onOptimizeAll={optimizer.optimizeAll}
            onDownload={optimizer.downloadSelected}
            onDownloadAll={optimizer.downloadAll}
            onCopy={optimizer.copySelectedToClipboard}
            onUndo={optimizer.undoLastOptimization}
            onReplace={optimizer.replaceSourceWithOptimized}
          />
        </>
      ) : null}

      {!selected ? <RecentFiles files={optimizer.recentFiles} /> : null}

      <ToastStack toasts={optimizer.toasts} onDismiss={optimizer.dismissToast} />
    </main>
  )
}
