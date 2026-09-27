import { memo } from "react"
import { FileType2 } from "lucide-react"
import type { OutputImageFormat } from "../types/image"
import { formatOutputLabel } from "../utils/convert"
import { availableOutputFormats } from "../utils/presets"

interface FormatSelectorProps {
  value: OutputImageFormat
  disabled: boolean
  isSvg: boolean
  warning: string | null
  onChange: (format: OutputImageFormat) => void
}

export const FormatSelector = memo(function FormatSelector({
  value,
  disabled,
  isSvg,
  warning,
  onChange,
}: FormatSelectorProps) {
  const isDisabled = disabled || isSvg

  return (
    <section className="panel control-panel" aria-labelledby="format-heading">
      <div className="panel-title-row">
        <div className="title-with-icon">
          <FileType2 size={16} aria-hidden="true" />
          <h2 id="format-heading">Format</h2>
        </div>
        {isSvg ? <span className="muted-label">Preview only</span> : null}
      </div>
      <div className="segmented-grid three" role="radiogroup" aria-label="Output format">
        {availableOutputFormats.map((format) => (
          <button
            key={format}
            className={`segment-button ${value === format ? "is-active" : ""}`}
            type="button"
            role="radio"
            aria-checked={value === format}
            disabled={isDisabled}
            onClick={() => onChange(format)}
          >
            {formatOutputLabel(format)}
          </button>
        ))}
      </div>
      {warning ? <div className="inline-warning">{warning}</div> : null}
    </section>
  )
})
