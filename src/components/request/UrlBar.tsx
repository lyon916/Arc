import { useRequestStore, useUiStore } from '../../store'
import { executeSend, cancelSend } from '../../utils/executeSend'
import { executeSave } from '../../utils/executeSave'
import { HTTP_METHODS } from '../../utils/shared'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Save, ChevronDown, Send, Shield } from 'lucide-react'
import { useIsMobile } from '../../hooks/useIsMobile'
import { t } from '../../i18n'

export function UrlBar() {
  const isMobile = useIsMobile()
  const [methodOpen, setMethodOpen] = useState(false)
  const [methodVisible, setMethodVisible] = useState(false)
  const closeMethod = () => {
    setMethodVisible(false)
    setTimeout(() => setMethodOpen(false), 150)
  }
  const openMethod = () => {
    setMethodOpen(true)
    requestAnimationFrame(() => setMethodVisible(true))
  }
  const request = useRequestStore((s) => s.request)
  const setMethod = useRequestStore((s) => s.setMethod)
  const setUrl = useRequestStore((s) => s.setUrl)
  const loading = useRequestStore((s) => s.loading)
  const autoSave = useUiStore((s) => s.autoSave)
  const setAutoSave = useUiStore((s) => s.setAutoSave)
  const useProxy = useUiStore((s) => s.useProxy)
  const setUseProxy = useUiStore((s) => s.setUseProxy)
  const showToast = useUiStore((s) => s.showToast)
  const lang = useUiStore((s) => s.lang)
  const tr = (key: string) => t[lang]?.[key] ?? key
  const methodBtnRef = useRef<HTMLDivElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState({ top: 0, left: 0 })

  // Close method dropdown on click outside
  useEffect(() => {
    if (!methodOpen) return
    const handler = () => closeMethod()
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [methodOpen])

  const handleSend = () => {
    if (!request.url) {
      showToast(tr('pleaseEnterUrl'), 'info')
      return
    }
    if (loading) return
    executeSend()
  }

  const sendBtn = loading ? (
    <button
      className="btn-brand flex items-center justify-center"
      style={{
        background: 'var(--status-error)',
        fontSize: isMobile ? 12 : 13,
        padding: isMobile ? '0 10px' : undefined,
        height: isMobile ? 30 : undefined,
        flexShrink: 0,
      }}
      onClick={cancelSend}
    >
      {tr('cancel')}
    </button>
  ) : (
    <button
      className="btn-brand flex items-center justify-center gap-1"
      style={{
        fontSize: isMobile ? 12 : 13,
        padding: isMobile ? '0 10px' : undefined,
        height: isMobile ? 30 : undefined,
        flexShrink: 0,
      }}
      onClick={handleSend}
    >
      <Send size={isMobile ? 14 : 15} />
      {tr('send')}
    </button>
  )

  const methodBtn = (
    <div ref={methodBtnRef} style={{ flexShrink: 0, position: 'relative' }}>
      <div
        role="button"
        className={`select-linear method-${request.method.toLowerCase()} flex items-center justify-between`}
        style={{ width: isMobile ? 64 : 115, fontSize: isMobile ? 12 : undefined }}
        onClick={(e) => {
          e.stopPropagation()
          if (!methodOpen) {
            const rect = methodBtnRef.current?.getBoundingClientRect()
            if (rect) setDropdownStyle({ top: rect.bottom + 4, left: rect.left })
            openMethod()
          } else {
            closeMethod()
          }
        }}
      >
        <span>{request.method}</span>
        <ChevronDown size={isMobile ? 10 : 13} style={{ opacity: 0.5 }} />
      </div>
      {methodOpen && createPortal(
      <ul
        className="menu p-1"
        style={{
          position: 'fixed',
          top: dropdownStyle.top,
          left: dropdownStyle.left,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-standard)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          width: 110,
          zIndex: 99999,
          opacity: methodVisible ? 1 : 0,
          transform: methodVisible ? 'scale(1)' : 'scale(0.95)',
          transition: 'opacity 0.15s ease-out, transform 0.15s ease-out',
        }}
      >
        {HTTP_METHODS.map((m) => (
          <li key={m}>
            <a
              className={`method-${m.toLowerCase()}`}
              style={{ fontFamily: 'var(--font-mono)', fontWeight: 510, fontSize: 13, padding: '6px 10px' }}
              onClick={() => {
                setMethod(m)
                closeMethod()
              }}
            >
              {m}
            </a>
          </li>
        ))}
      </ul>
      , document.body)}
    </div>
  )

  return (
    <div className="flex items-center" style={{ gap: isMobile ? 4 : 8, height: isMobile ? 36 : 50 }}>
      {methodBtn}

      <input
        id="url-input"
        type="text"
        className="input-linear flex-1"
        placeholder={tr('urlPlaceholder')}
        value={request.url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSend()
        }}
        style={{ fontSize: isMobile ? 13 : undefined, height: isMobile ? 30 : undefined }}
      />

      {sendBtn}

      <button
        className={`btn-ghost-linear flex items-center justify-center ${useProxy ? 'ring-2' : ''}`}
        style={{
          flexShrink: 0,
          width: isMobile ? 48 : 52,
          height: isMobile ? 30 : 46,
          padding: 0,
          border: '1px solid var(--border-subtle)',
          color: useProxy ? 'var(--accent-brand)' : 'var(--text-muted)',
          borderRadius: 'var(--radius-md)',
          transition: 'color var(--transition-normal)',
        }}
        onClick={() => {
          const next = !useProxy
          setUseProxy(next)
          showToast(tr(next ? 'proxyOn' : 'proxyOff'), 'info', undefined, 2000)
        }}
        title={tr('useProxy')}
      >
        <Shield size={isMobile ? 14 : 16} />
      </button>

      <div style={{ display: 'flex', flexShrink: 0 }}>
        <button
          className="btn-ghost-linear flex items-center gap-1"
          style={{
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            paddingLeft: isMobile ? 4 : 5,
            paddingRight: isMobile ? 4 : 5,
            fontSize: isMobile ? 12 : undefined,
          }}
          onClick={(e) => {
            executeSave()
            ;(e.currentTarget as HTMLElement)?.blur()
          }}
        >
          <Save size={isMobile ? 13 : 15} />
          {!isMobile && tr('save')}
        </button>
        <div className="dropdown dropdown-end" style={{ display: 'flex' }}>
          <button
            tabIndex={0}
            role="button"
            className="btn-ghost-linear flex items-center justify-center"
            style={{
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              borderLeft: 'none',
              width: isMobile ? 22 : 28,
            }}
          >
            <ChevronDown size={isMobile ? 12 : 15} />
          </button>
          <ul
            tabIndex={0}
            className="dropdown-content menu p-1"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-standard)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              zIndex: 9999,
              minWidth: 160,
              top: '100%',
            }}
          >
            <li>
              <a
                style={{ fontSize: 12, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={(e) => {
                  e.preventDefault()
                  setAutoSave(!autoSave)
                  ;(document.activeElement as HTMLElement)?.blur()
                }}
              >
                <span>{tr('autoSave')}</span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 590,
                  color: autoSave ? 'var(--status-success)' : 'var(--text-muted)',
                }}>
                  {autoSave ? tr('on') : tr('off')}
                </span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
