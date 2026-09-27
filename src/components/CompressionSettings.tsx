import { memo } from "react"
import { Gauge } from "lucide-react"
import type { CompressionPresetId, OptimizationEstimate } from "../types/image"
import { compressionPresets } from "../utils/presets"
import { formatBytes } from "../utils/imageInfo"

interface CompressionSettingsProps {
  preset: CompressionPresetId
  quality: number
  estimate: OptimizationEstimate | null
  disabled: boolean
  onPresetChange: (preset: CompressionPresetId) => void
  onQualityChange: (quality: number) => void
}

export const CompressionSettings = memo(function CompressionSettings({
  preset,
  quality,
  estimate,
  disabled,
  onPresetChange,
  onQualityChange,
}: CompressionSettingsProps) {
  return (
    <section className="panel control-panel" aria-labelledby="compression-heading">
      <div className="panel-title-row">
        <div className="title-with-icon">
          <Gauge size={16} aria-hidden="true" />
          <h2 id="compression-heading">Smart Compression</h2>
        </div>
        <span className="value-pill">{quality}%</span>
      </div>

      <div className="preset-grid" role="radiogroup" aria-label="Compression preset">
        {compressionPresets.map((option) => (
          <button
            key={option.id}
            className={`preset-button ${preset === option.id ? "is-active" : ""}`}
            type="button"
            role="radio"
            aria-checked={preset === option.id}
            disabled={disabled}
            onClick={() => onPresetChange(option.id)}
          >
            <span>{option.label}</span>
            <small>{option.description}</small>
          </button>
        ))}
      </div>

      <input
        className="quality-slider"
        type="range"
        min="1"
        max="100"
        value={quality}
        disabled={disabled}
        onChange={(event) => onQualityChange(Number(event.target.value))}
        aria-label="Manual compression quality"
      />
      <div className="range-labels" aria-hidden="true">
        <span>Smallest</span>
        <span>Manual quality</span>
        <span>Sharpest</span>
      </div>

      {estimate ? (
        <div className="estimate-strip" aria-live="polite">
          <span>Estimate</span>
          <strong>{formatBytes(estimate.estimatedSize)}</strong>
          <span>{estimate.savedPercent}% saved</span>
        </div>
      ) : null}
    </section>
  )
})
