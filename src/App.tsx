import { useEffect, useState } from 'react'
import { Navbar } from './components/layout/Navbar'
import { Sidebar } from './components/layout/Sidebar'
import { MobileNav, type MobileTab } from './components/layout/MobileNav'
import { RequestPanel } from './components/request/RequestPanel'
import { ResponsePanel } from './components/response/ResponsePanel'
import { SplitPane } from './components/common/SplitPane'
import Toast from './components/common/Toast'
import { useUiStore, useRequestStore } from './store'
import { executeSend, cancelSend } from './utils/executeSend'
import { executeSave } from './utils/executeSave'
import { useDragResize } from './hooks/useDragResize'
import { useIsMobile } from './hooks/useIsMobile'

export default function App() {
  const isMobile = useIsMobile()
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const sidebarWidth = useUiStore((s) => s.sidebarWidth)
  const setSidebarWidth = useUiStore((s) => s.setSidebarWidth)
  const response = useRequestStore((s) => s.response)

  const [mobileTab, setMobileTab] = useState<MobileTab>('request')

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault()
        executeSend()
      } else if (e.key === 'Escape') {
        cancelSend()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        executeSave()
      } else if (e.ctrlKey && !e.metaKey && e.key === 'l') {
        // Ctrl+L (Windows/Linux) → focus URL bar. Cmd+L (macOS) passes through — browser handles it.
        e.preventDefault()
        document.getElementById('url-input')?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Auto-switch to response tab when a response comes in on mobile
  useEffect(() => {
    if (isMobile && response) {
      setMobileTab('response')
    }
  }, [response, isMobile])

  // Sidebar resize drag (desktop only)
  const onMouseDown = useDragResize({
    axis: 'x',
    onResize: setSidebarWidth,
    clamp: (v) => Math.max(180, Math.min(500, v)),
  })

  // === MOBILE LAYOUT ===
  if (isMobile) {
    return (
      <div className="h-dvh flex flex-col overflow-hidden" style={{ background: 'var(--bg-canvas)' }}>
        <Navbar />
        <Toast />

        {/* Content — one panel at a time */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {mobileTab === 'request' && (
            <div className="h-full overflow-auto">
              <RequestPanel />
            </div>
          )}
          {mobileTab === 'response' && (
            <div className="h-full overflow-auto">
              <ResponsePanel />
            </div>
          )}
          {mobileTab === 'history' && (
            <div className="h-full overflow-auto" style={{ background: 'var(--bg-panel)' }}>
              <Sidebar forceTab="history" />
            </div>
          )}
          {mobileTab === 'workspace' && (
            <div className="h-full overflow-auto" style={{ background: 'var(--bg-panel)' }}>
              <Sidebar forceTab="workspace" />
            </div>
          )}
        </div>

        <MobileNav
          active={mobileTab}
          onChange={setMobileTab}
          hasResponse={!!response}
        />
      </div>
    )
  }

  // === DESKTOP LAYOUT ===
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg-canvas)' }}>
      <Navbar />
      <Toast />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with width transition */}
        <div
          style={{
            width: sidebarOpen ? sidebarWidth : 0,
            overflow: 'hidden',
            flexShrink: 0,
            transition: 'width 250ms ease',
          }}
        >
          <div style={{ width: sidebarWidth, height: '100%', opacity: sidebarOpen ? 1 : 0, transition: 'opacity 200ms ease' }}>
            <Sidebar />
          </div>
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={onMouseDown}
          style={{
            width: '4px',
            cursor: 'col-resize',
            background: 'var(--border-subtle)',
            transition: 'background var(--transition-normal)',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-brand)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--border-subtle)' }}
        />

        <main className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--bg-canvas)' }}>
          <SplitPane>
            <RequestPanel />
            <ResponsePanel />
          </SplitPane>
        </main>
      </div>
    </div>
  )
}
