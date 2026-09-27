import { memo } from "react"

interface ProgressBarProps {
  progress: number
  visible: boolean
  label?: string
}

export const ProgressBar = memo(function ProgressBar({ progress, visible, label = "Processing" }: ProgressBarProps) {
  if (!visible) return null

  return (
    <div className="progress-wrap" role="status" aria-live="polite">
      <div className="progress-label">
        <span>{label}</span>
        <span>{progress}%</span>
      </div>
      <div className="progress-track" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
})
