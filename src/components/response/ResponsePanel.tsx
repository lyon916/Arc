import { useState, useEffect, useRef } from 'react'
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

function formatElapsed(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`
  return `${ms}ms`
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 590,
          color: 'var(--text-primary)',
          padding: '6px 0',
          borderBottom: '2px solid var(--border-standard)',
          marginBottom: 2,
        }}
      >
        {title}
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  )
}

function HeaderRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex gap-3 py-1.5 text-xs"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: 510,
          color: 'var(--text-secondary)',
          minWidth: 160,
          flexShrink: 0,
          wordBreak: 'break-all',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-tertiary)',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </span>
    </div>
  )
}

export function ResponsePanel() {
  const response = useRequestStore((s) => s.response)
  const error = useRequestStore((s) => s.error)
  const loading = useRequestStore((s) => s.loading)
  const request = useRequestStore((s) => s.request)
  const streamingBody = useRequestStore((s) => s.streamingBody)
  const responseTimestamp = useRequestStore((s) => s.responseTimestamp)
  const showToast = useUiStore((s) => s.showToast)
  const [viewMode, setViewMode] = useState<ViewMode>('pretty')
  const [showFullBody, setShowFullBody] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const lang = useUiStore((s) => s.lang)
  const tr = (key: string) => t[lang]?.[key] ?? key

  // 流式返回计时
  const streamStartRef = useRef<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (streamingBody !== null) {
      if (streamStartRef.current === null) {
        streamStartRef.current = Date.now()
      }
      const timer = setInterval(() => {
        setElapsed(Date.now() - streamStartRef.current!)
      }, 80)
      return () => clearInterval(timer)
    } else {
      streamStartRef.current = null
      setElapsed(0)
    }
  }, [streamingBody])

  const LARGE_BODY_THRESHOLD = 500 * 1024 // 500KB
  const isLargeBody = response && response.size > LARGE_BODY_THRESHOLD
  const displayBody = isLargeBody && !showFullBody && viewMode === 'raw'
    ? response!.body.slice(0, LARGE_BODY_THRESHOLD) + '\n\n… 响应体过大，已截断显示'
    : response?.body || ''

  if (loading && streamingBody == null) {
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

  // When SSE is streaming, render the live body with a small indicator.
  if (loading && streamingBody !== null) {
    return (
      <div className="flex flex-col h-full" style={{ background: 'var(--bg-canvas)', paddingRight: 12 }}>
        <div
          className="flex items-center pl-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)', gap: 8, padding: '8px 12px' }}
        >
          <svg width="14" height="14" viewBox="0 0 32 32" className="animate-spin" style={{ color: 'var(--accent-brand)', flexShrink: 0 }}>
            <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="48 24" strokeLinecap="round" />
          </svg>
          <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Streaming…</span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>
            {formatElapsed(elapsed)}
          </span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: 11, marginLeft: 'auto' }}>
            {formatSize(new Blob([streamingBody]).size)}
          </span>
        </div>
        <div className="flex-1 overflow-auto p-3">
          <pre
            className="code-block p-3 whitespace-pre-wrap"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}
          >
            {streamingBody}
          </pre>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 animate-fade-in" style={{ padding: '32px 24px' }}>
        <div
          style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'var(--accent-brand-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--status-error)" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 590, marginBottom: 4 }}>
            {tr('requestFailed')}
          </p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
            {error}
          </p>
        </div>

        <div
          className="code-block px-4 py-2.5"
          style={{
            fontSize: 11,
            color: 'var(--text-secondary)',
          }}
        >
          <span className={`font-weight-590 method-${request.method.toLowerCase()}`}>{request.method}</span>
          {' '}
          <span style={{ color: 'var(--text-tertiary)', wordBreak: 'break-all' }}>{request.url}</span>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'center', maxWidth: 360 }}>
          {tr('networkError')}
        </p>
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

        {responseTimestamp != null && (
          <span style={{ color: 'var(--text-tertiary)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
            {formatTime(responseTimestamp)}
          </span>
        )}

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
        <div key={viewMode} className="animate-fade-in">
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
          <div className="flex flex-col gap-3">
            {/* General */}
            <Section title={tr('general')}>
              <HeaderRow label="Request URL" value={request.url} />
              <HeaderRow label="Request Method" value={request.method} />
              <HeaderRow label="Status Code" value={`${response.status} ${response.statusText}`} />
            </Section>

            {/* Response Headers */}
            <Section title={tr('responseHeaders')}>
              {Object.entries(response.headers).map(([key, value]) => (
                <HeaderRow key={key} label={key} value={value} />
              ))}
            </Section>

            {/* Request Headers */}
            <Section title={tr('requestHeaders')}>
              {request.headers.filter(h => h.enabled && h.key).map((h) => (
                <HeaderRow key={h.key} label={h.key} value={h.value} />
              ))}
              {request.headers.filter(h => h.enabled && h.key).length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: 11, padding: '8px 0' }}>—</div>
              )}
            </Section>
          </div>
        )}
        </div>
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