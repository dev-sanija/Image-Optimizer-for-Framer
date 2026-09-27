import { memo } from "react"
import { RefreshCw, Trash2 } from "lucide-react"
import type { ImageQueueItem } from "../types/image"
import { formatBytes, formatImageFormat } from "../utils/imageInfo"

interface QueueListProps {
  items: ImageQueueItem[]
  selectedId: string | null
  activeProcessingId: string | null
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onRetry: (id: string) => void
}

export const QueueList = memo(function QueueList({
  items,
  selectedId,
  activeProcessingId,
  onSelect,
  onRemove,
  onRetry,
}: QueueListProps) {
  if (items.length === 0) {
    return (
      <section className="panel queue-panel empty-state">
        <strong>No images queued</strong>
        <span>Add one or many files to start optimizing.</span>
      </section>
    )
  }

  return (
    <section className="panel queue-panel" aria-labelledby="queue-heading">
      <div className="panel-title-row">
        <h2 id="queue-heading">Queue</h2>
        <span className="muted-label">{items.length} image{items.length === 1 ? "" : "s"}</span>
      </div>
      <div className="queue-list">
        {items.map((item) => (
          <div key={item.id} className={`queue-row ${selectedId === item.id ? "is-active" : ""}`}>
            <button
              className="queue-select"
              type="button"
              onClick={() => onSelect(item.id)}
              aria-pressed={selectedId === item.id}
            >
              <img src={item.previewUrl} alt="" aria-hidden="true" />
              <span className="queue-main">
                <strong>{item.info.name}</strong>
                <small>
                  {formatImageFormat(item.info.format)} - {formatBytes(item.info.fileSize)}
                </small>
                {item.status === "processing" ? (
                  <span className="mini-progress" aria-label={`${item.progress}% complete`}>
                    <span style={{ width: `${item.progress}%` }} />
                  </span>
                ) : null}
                {item.error ? <small className="queue-error">{item.error}</small> : null}
              </span>
              <span className={`status-dot ${item.status}`} aria-label={item.status} />
            </button>
            {item.status === "error" ? (
              <button
                className="queue-icon"
                type="button"
                onClick={() => onRetry(item.id)}
                title="Retry"
                aria-label={`Retry ${item.info.name}`}
              >
                <RefreshCw size={13} aria-hidden="true" />
              </button>
            ) : null}
            <button
              className="queue-icon"
              type="button"
              onClick={() => onRemove(item.id)}
              title="Remove"
              aria-label={`Remove ${item.info.name}`}
            >
              <Trash2 size={13} aria-hidden="true" />
            </button>
            {activeProcessingId === item.id ? <span className="spinner" aria-hidden="true" /> : null}
          </div>
        ))}
      </div>
    </section>
  )
})
