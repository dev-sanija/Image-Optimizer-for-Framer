import { memo, useCallback, useState } from "react"
import type { ImageQueueItem } from "../types/image"

interface ComparisonSliderProps {
  item: ImageQueueItem
}

export const ComparisonSlider = memo(function ComparisonSlider({ item }: ComparisonSliderProps) {
  const [position, setPosition] = useState(50)
  const optimizedUrl = item.result?.previewUrl

  const updatePosition = useCallback((clientX: number, rect: DOMRect) => {
    const next = ((clientX - rect.left) / rect.width) * 100
    setPosition(Math.max(0, Math.min(100, next)))
  }, [])

  if (!optimizedUrl) {
    return (
      <section className="panel comparison-panel" aria-labelledby="preview-heading">
        <div className="panel-title-row">
          <h2 id="preview-heading">Image Preview</h2>
          <span className="muted-label">Before optimization</span>
        </div>
        <div className="comparison-empty">
          <img src={item.previewUrl} alt={`${item.info.name} original preview`} />
          <div>
            <strong>Ready to compare</strong>
            <span>Optimize this image to reveal the before and after slider.</span>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="panel comparison-panel" aria-labelledby="comparison-heading">
      <div className="panel-title-row">
        <h2 id="comparison-heading">Before / After</h2>
        <span className="muted-label">Drag to compare</span>
      </div>
      <div
        className="comparison-stage"
        onPointerMove={(event) => {
          if (event.buttons !== 1) return
          updatePosition(event.clientX, event.currentTarget.getBoundingClientRect())
        }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          updatePosition(event.clientX, event.currentTarget.getBoundingClientRect())
        }}
      >
        <img className="comparison-image" src={item.previewUrl} alt={`${item.info.name} original`} />
        <div className="comparison-after" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
          <img className="comparison-image" src={optimizedUrl} alt={`${item.info.name} optimized`} />
        </div>
        <div className="comparison-divider" style={{ left: `${position}%` }} aria-hidden="true" />
        <input
          className="comparison-range"
          type="range"
          min="0"
          max="100"
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          aria-label="Compare original and optimized image"
        />
        <span className="comparison-badge left">Original</span>
        <span className="comparison-badge right">Optimized</span>
      </div>
    </section>
  )
})
