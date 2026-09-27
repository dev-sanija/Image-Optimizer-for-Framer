import { memo } from "react"
import { CheckCircle2, Info, X, XCircle } from "lucide-react"
import type { ToastMessage } from "../types/image"

interface ToastStackProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

export const ToastStack = memo(function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (toasts.length === 0) return null

  return (
    <div className="toast-stack" aria-live="polite" aria-label="Notifications">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.tone}`}>
          {toast.tone === "success" ? <CheckCircle2 size={16} /> : null}
          {toast.tone === "error" ? <XCircle size={16} /> : null}
          {toast.tone === "info" ? <Info size={16} /> : null}
          <span>{toast.message}</span>
          <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
})
