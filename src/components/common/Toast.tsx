import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, XCircle, Info, X, RotateCcw } from 'lucide-react'
import { useUiStore } from '../../store'

export default function Toast() {
  const toast = useUiStore((s) => s.toast)
  const clearToast = useUiStore((s) => s.clearToast)

  const [paused, setPaused] = useState(false)
  const duration = toast?.duration ?? (toast?.action ? 6000 : 3000)

  useEffect(() => {
    if (!toast || paused) return
    const timer = setTimeout(clearToast, duration)
    return () => clearTimeout(timer)
  }, [toast, paused, clearToast, duration])

  const handleAction = useCallback(() => {
    toast?.action?.onClick()
    clearToast()
  }, [toast, clearToast])

  if (!toast) return null

  const colors = {
    success: 'var(--status-success)',
    error: 'var(--status-error)',
    info: 'var(--accent-brand)',
  }

  const icons = {
    success: <CheckCircle size={16} />,
    error: <XCircle size={16} />,
    info: <Info size={16} />,
  }

  return (
    <div className="toast toast-bottom toast-end" style={{ zIndex: 9999 }}>
      <div
        className="alert flex items-center gap-2 animate-slide-in-left"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        style={{
          padding: '10px 16px',
          fontSize: 13,
          fontWeight: 510,
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${colors[toast.type]}33`,
          background: 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}
      >
        <span style={{ color: colors[toast.type] }}>{icons[toast.type]}</span>
        <span>{toast.message}</span>
        {toast.action && (
          <button
            onClick={handleAction}
            style={{
              marginLeft: 4,
              padding: '3px 10px',
              fontSize: 12,
              fontWeight: 510,
              color: 'var(--accent-brand)',
              background: 'var(--accent-brand-light)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <RotateCcw size={12} />
            {toast.action.label}
          </button>
        )}
        <button className="btn btn-sm btn-ghost" onClick={clearToast} style={{ marginLeft: 4, padding: '4px 8px' }}>
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
