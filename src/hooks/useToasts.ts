import { useCallback, useEffect, useState } from "react"
import type { ToastMessage, ToastTone } from "../types/image"

export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((tone: ToastTone, message: string) => {
    const id = createId()
    setToasts((current) => [...current, { id, tone, message }])
    return id
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  useEffect(() => {
    if (toasts.length === 0) return undefined

    const timeout = window.setTimeout(() => {
      setToasts((current) => current.slice(1))
    }, 4200)

    return () => window.clearTimeout(timeout)
  }, [toasts])

  return { toasts, showToast, dismissToast }
}

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}
