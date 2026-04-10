import { useEffect } from 'react'
import { useUiStore } from '../../stores/uiStore'

const toneClass = {
  success: 'bg-green-600',
  info: 'bg-gray-900',
  error: 'bg-red-600',
} as const

export const Toast = () => {
  const toast = useUiStore((s) => s.toast)
  const clearToast = useUiStore((s) => s.clearToast)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => clearToast(), 2200)
    return () => window.clearTimeout(timer)
  }, [toast, clearToast])

  if (!toast) return null

  return (
    <div className="pointer-events-none fixed bottom-20 left-1/2 z-[90] -translate-x-1/2">
      <div className={`rounded-full px-4 py-2 text-sm text-white shadow-lg ${toneClass[toast.type]}`}>
        {toast.message}
      </div>
    </div>
  )
}
