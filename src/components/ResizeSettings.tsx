import { memo } from "react"
import { ChevronDown, Lock, Maximize2, Unlock } from "lucide-react"
import type { ImageMetadata, ResizeDimensions, ResizeMode, ResizeOptions } from "../types/image"
import { resizePresets } from "../utils/presets"

interface ResizeSettingsProps {
  info: ImageMetadata
  resize: ResizeOptions
  targetDimensions: ResizeDimensions | null
  disabled: boolean
  onModeChange: (mode: ResizeMode) => void
  onCustomDimensionChange: (field: "width" | "height", value: number) => void
  onMaintainAspectRatioChange: (maintain: boolean) => void
  onLockDimensionsChange: (locked: boolean) => void
}

export const ResizeSettings = memo(function ResizeSettings({
  info,
  resize,
  targetDimensions,
  disabled,
  onModeChange,
  onCustomDimensionChange,
  onMaintainAspectRatioChange,
  onLockDimensionsChange,
}: ResizeSettingsProps) {
  return (
    <section className="panel control-panel" aria-labelledby="resize-heading">
      <div className="panel-title-row">
        <div className="title-with-icon">
          <Maximize2 size={16} aria-hidden="true" />
          <h2 id="resize-heading">Resize</h2>
        </div>
        <span className="muted-label">
          {targetDimensions ? `${targetDimensions.width} x ${targetDimensions.height}` : `${info.width} x ${info.height}`}
        </span>
      </div>

      <div className="select-shell">
        <select
          className="select-control"
          value={resize.mode}
          disabled={disabled}
          onChange={(event) => onModeChange(event.target.value as ResizeMode)}
          aria-label="Resize preset"
        >
          {resizePresets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} aria-hidden="true" />
      </div>

      <div className="dimension-grid">
        <label>
          <span>Width</span>
          <input
            type="number"
            min="1"
            max="12000"
            value={resize.customWidth}
            disabled={disabled || resize.lockDimensions}
            onChange={(event) => onCustomDimensionChange("width", Number(event.target.value))}
            aria-label="Custom width"
          />
        </label>
        <label>
          <span>Height</span>
          <input
            type="number"
            min="1"
            max="12000"
            value={resize.customHeight}
            disabled={disabled || resize.lockDimensions}
            onChange={(event) => onCustomDimensionChange("height", Number(event.target.value))}
            aria-label="Custom height"
          />
        </label>
      </div>

      <div className="toggle-grid">
        <label className="check-row">
          <input
            type="checkbox"
            checked={resize.maintainAspectRatio}
            disabled={disabled}
            onChange={(event) => onMaintainAspectRatioChange(event.target.checked)}
          />
          <span>Maintain aspect ratio</span>
        </label>
        <button
          className={`lock-button ${resize.lockDimensions ? "is-active" : ""}`}
          type="button"
          disabled={disabled}
          onClick={() => onLockDimensionsChange(!resize.lockDimensions)}
          aria-pressed={resize.lockDimensions}
        >
          {resize.lockDimensions ? <Lock size={16} /> : <Unlock size={16} />}
          {resize.lockDimensions ? "Locked" : "Unlocked"}
        </button>
      </div>
    </section>
  )
})
