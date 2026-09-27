import { memo } from "react"
import { RotateCcw, Sparkles } from "lucide-react"

interface HeaderProps {
  onReset: () => void
  hasImages: boolean
}

export const Header = memo(function Header({ onReset, hasImages }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="brand-lockup">
        <div className="brand-mark" aria-hidden="true">
          <Sparkles size={18} strokeWidth={2.25} />
        </div>
        <div>
          <h1>AI Image Optimizer</h1>
          <p>Optimize images for the web</p>
        </div>
      </div>
      <button
        className="icon-button"
        type="button"
        onClick={onReset}
        disabled={!hasImages}
        aria-label="Reset queue"
        title="Reset queue"
      >
        <RotateCcw size={16} aria-hidden="true" />
      </button>
    </header>
  )
})
