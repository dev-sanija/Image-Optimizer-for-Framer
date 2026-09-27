import { memo } from "react"
import { Archive, Clipboard, Download, Layers, RotateCcw, Wand2 } from "lucide-react"

interface ActionButtonsProps {
  canOptimize: boolean
  canOptimizeAll: boolean
  canDownload: boolean
  canDownloadAll: boolean
  canCopy: boolean
  canUndo: boolean
  isProcessing: boolean
  onOptimize: () => void
  onOptimizeAll: () => void
  onDownload: () => void
  onDownloadAll: () => void
  onCopy: () => void
  onUndo: () => void
  onReplace: () => void
}

export const ActionButtons = memo(function ActionButtons({
  canOptimize,
  canOptimizeAll,
  canDownload,
  canDownloadAll,
  canCopy,
  canUndo,
  isProcessing,
  onOptimize,
  onOptimizeAll,
  onDownload,
  onDownloadAll,
  onCopy,
  onUndo,
  onReplace,
}: ActionButtonsProps) {
  return (
    <section className="action-card" aria-label="Export actions">
      <div className="section-heading action-heading">
        <span>Export</span>
        <strong>Finish and use</strong>
      </div>
      <div className="action-bar">
        <button
          className="button button-primary"
          type="button"
          onClick={onOptimize}
          disabled={!canOptimize}
          title="Optimize selected image"
        >
          <Wand2 size={18} aria-hidden="true" />
          {isProcessing ? "Optimizing" : "Optimize"}
        </button>
        <button
          className="button button-secondary"
          type="button"
          onClick={onOptimizeAll}
          disabled={!canOptimizeAll}
          title="Compress all queued images"
        >
          <Layers size={18} aria-hidden="true" />
          Compress All
        </button>
        <button
          className="icon-action"
          type="button"
          onClick={onDownload}
          disabled={!canDownload}
          title="Download"
          aria-label="Download optimized image"
        >
          <Download size={18} aria-hidden="true" />
        </button>
        <button
          className="icon-action"
          type="button"
          onClick={onDownloadAll}
          disabled={!canDownloadAll}
          title="Download ZIP"
          aria-label="Download optimized images as ZIP"
        >
          <Archive size={18} aria-hidden="true" />
        </button>
        <button
          className="icon-action"
          type="button"
          onClick={onCopy}
          disabled={!canCopy}
          title="Copy optimized image"
          aria-label="Copy optimized image to clipboard"
        >
          <Clipboard size={18} aria-hidden="true" />
        </button>
        <button
          className="icon-action"
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo last optimization"
          aria-label="Undo last optimization"
        >
          <RotateCcw size={18} aria-hidden="true" />
        </button>
        <button className="button button-subtle" type="button" onClick={onReplace} disabled={!canDownload}>
          Replace Source
        </button>
      </div>
    </section>
  )
})
