import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Maximize2, Minimize2 } from 'lucide-react'
import { useRequestStore, useUiStore } from '../../store'
import { t } from '../../i18n'
import { JsonTreeView } from './JsonTreeView'
import { statusClass } from '../../utils/shared'

type ViewMode = 'pretty' | 'raw' | 'headers'

function formatDuration(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(ms >= 10000 ? 0 : 1)}s`
  return `${ms}ms`
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

export function ResponsePanel() {
  const response = useRequestStore((s) => s.response)
  const error = useRequestStore((s) => s.error)
  const loading = useRequestStore((s) => s.loading)
  const showToast = useUiStore((s) => s.showToast)
  const [viewMode, setViewMode] = useState<ViewMode>('pretty')
  const [showFullBody, setShowFullBody] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const lang = useUiStore((s) => s.lang)
  const tr = (key: string) => t[lang]?.[key] ?? key

  const LARGE_BODY_THRESHOLD = 500 * 1024 // 500KB
  const isLargeBody = response && response.size > LARGE_BODY_THRESHOLD
  const displayBody = isLargeBody && !showFullBody && viewMode === 'raw'
    ? response!.body.slice(0, LARGE_BODY_THRESHOLD) + '\n\n… 响应体过大，已截断显示'
    : response?.body || ''

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full animate-fade-in">
        <svg width="32" height="32" viewBox="0 0 32 32" className="animate-spin" style={{ color: 'var(--accent-brand)' }}>
          <circle
            cx="16" cy="16" r="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray="48 24"
            strokeLinecap="round"
          />
        </svg>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full animate-fade-in">
        <div
          className="px-4 py-3 rounded-md max-w-lg text-sm"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-standard)',
            color: 'var(--status-error)',
          }}
        >
          {error}
        </div>
      </div>
    )
  }

  if (!response) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: 'var(--text-tertiary)', opacity: 0.35 }}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
          sendToSee
        </p>
      </div>
    )
  }

  const sizeStr = formatSize(response.size)
  const durationStr = formatDuration(response.duration)

  let parsedJson: unknown = null
  try {
    parsedJson = JSON.parse(response.body)
  } catch { /* not JSON */ }

  const copyBody = () => {
    navigator.clipboard.writeText(response.body).then(
      () => showToast('copySuccess', 'success'),
      () => showToast('copyFailed', 'error'),
    )
  }
  const downloadBody = () => {
    const blob = new Blob([response.body], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `response_${response.status}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const content = (
    <>
      {/* View tabs + status bar (merged row) */}
      <div
        className="flex items-center pl-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)', gap: 8 }}
      >
        {(['pretty', 'raw', 'headers'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            className={`tab-linear ${viewMode === mode ? 'tab-active' : ''}`}
            onClick={() => setViewMode(mode)}
          >
            {tr(mode)}
          </button>
        ))}

        <div className="flex-1" />

        <span
          className={`px-2 py-0.5 rounded font-weight-590 ${statusClass(response.status)}`}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-standard)',
            fontSize: 11,
          }}
        >
          {response.status} {response.statusText}
        </span>
        <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{durationStr}</span>
        <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{sizeStr}</span>

        <div style={{ display: 'flex', flexShrink: 0 }}>
          <button className="btn-ghost-linear" style={{ fontSize: 11, padding: '3px 10px', borderTopRightRadius: 0, borderBottomRightRadius: 0 }} onClick={copyBody}>{tr('copy')}</button>
          <button className="btn-ghost-linear" style={{ fontSize: 11, padding: '3px 10px', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderLeft: 'none' }} onClick={downloadBody}>{tr('download')}</button>
          <button
            className="btn-ghost-linear"
            style={{ fontSize: 11, padding: '3px 10px', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: 'none' }}
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? tr('exitFullscreen') : tr('fullscreen')}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* Large body warning */}
      {isLargeBody && !showFullBody && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          background: 'var(--accent-brand-light)',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: 12,
          color: 'var(--accent-brand)',
        }}>
          <span>largeBody ({(response.size / 1024).toFixed(0)} KB)，largeBodyTruncated</span>
          <button
            className="btn-ghost-linear"
            style={{ fontSize: 11, padding: '2px 8px', marginLeft: 'auto' }}
            onClick={() => setShowFullBody(true)}
          >
            showAll
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {viewMode === 'pretty' && (
          parsedJson !== null ? (
            <JsonTreeView data={parsedJson} />
          ) : (
            <pre
              className="whitespace-pre-wrap"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}
            >
              {displayBody}
            </pre>
          )
        )}

        {viewMode === 'raw' && (
          <pre className="code-block p-3 whitespace-pre-wrap">{displayBody}</pre>
        )}

        {viewMode === 'headers' && (
          <div className="flex flex-col gap-1">
            {Object.entries(response.headers).map(([key, value]) => (
              <div
                key={key}
                className="flex gap-2 py-1.5 px-2 text-xs"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <span className="json-key font-weight-510" style={{ fontFamily: 'var(--font-mono)' }}>{key}</span>
                <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )

  return isFullscreen
    ? createPortal(
        <div
          className="flex flex-col"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'var(--bg-canvas)',
          }}
        >
          {content}
        </div>,
        document.body
      )
    : (
      <div className="flex flex-col h-full" style={{ background: 'var(--bg-canvas)', paddingRight: 12 }}>
        {content}
      </div>
    )
}