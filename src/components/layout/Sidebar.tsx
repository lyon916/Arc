import { useEffect, useState } from 'react'
import { t } from '../../i18n'
import { Plus, Terminal, ChevronDown } from 'lucide-react'
import { useUiStore, useRequestStore } from '../../store'
import CurlImportModal from '../common/CurlImportModal'
import { addWorkspaceFolder } from '../../hooks/useWorkspace'
import { loadHistory, deleteHistory } from '../../hooks/useHistory'
import type { HistoryRecord } from '../../db'
import { db } from '../../db'
import { HistoryList } from '../history/HistoryList'
import WorkspaceTree from '../workspace/WorkspaceTree'

export function Sidebar({ forceTab }: { forceTab?: 'history' | 'workspace' }) {
  const sidebarTab = useUiStore((s) => s.sidebarTab)
  const setSidebarTab = useUiStore((s) => s.setSidebarTab)
  const effectiveTab = forceTab ?? sidebarTab
  const historyVersion = useUiStore((s) => s.historyVersion)
  const loadRequest = useRequestStore((s) => s.loadRequest)
  const resetRequest = useRequestStore((s) => s.resetRequest)
  const lang = useUiStore((s) => s.lang)
  const tr = (key: string) => t[lang]?.[key] ?? key
  const showToast = useUiStore((s) => s.showToast)
  const bumpWorkspace = useUiStore((s) => s.bumpWorkspace)
  const [showCurlImport, setShowCurlImport] = useState(false)
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<HistoryRecord[]>([])

  useEffect(() => {
    setLoading(true)
    loadHistory().then((data) => { setRecords(data); setLoading(false) })
      .catch(() => { setLoading(false); showToast(tr('historyLoadFailed'), 'error') })
  }, [historyVersion])

  const handleReplay = (r: HistoryRecord) => {
    loadRequest(r.request)
  }

  const handleDeleteHistory = async (id: number) => {
    const snapshot = records.find((r) => r.id === id)
    if (!snapshot) return
    await deleteHistory(id)
    setRecords((prev) => prev.filter((r) => r.id !== id))
    showToast(tr('historyDeleted'), 'info', {
      label: tr('undo'),
      onClick: async () => {
        await db.history.add(snapshot)
        setRecords((prev) => {
          const next = [...prev, snapshot]
          next.sort((a, b) => b.createdAt - a.createdAt)
          return next
        })
        showToast(tr('undone'), 'success')
      },
    }, 6000)
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--bg-panel)',
        borderRight: '1px solid var(--border-subtle)',
        padding: '12px 0 0 0',
      }}
      className="flex flex-col"
    >
      {/* Tabs — hidden on mobile (forceTab) */}
      {!forceTab && (
      <div className="flex items-center pl-2" style={{ height: 50, overflow: 'visible', paddingRight: 4 }}>
        <div className="flex gap-1 flex-1">
          <button
            className={`tab-linear ${sidebarTab === 'workspace' ? 'tab-active' : ''}`}
            onClick={() => setSidebarTab('workspace')}
            style={lang === 'en' ? { paddingLeft: 8, paddingRight: 8 } : { paddingLeft: 16, paddingRight: 16 }}
          >
            {tr('workspace')}
          </button>
          <button
            className={`tab-linear ${sidebarTab === 'history' ? 'tab-active' : ''}`}
            onClick={() => setSidebarTab('history')}
            style={lang === 'en' ? { paddingLeft: 8, paddingRight: 8 } : { paddingLeft: 16, paddingRight: 16 }}
          >
            {tr('history')}
          </button>
        </div>
        <div style={{ display: 'flex', flexShrink: 0 }}>
          <button
            className="btn-brand"
            style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 510, padding: '13px 9px', borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
            onClick={() => { resetRequest(); setSidebarTab('workspace'); showToast(tr('newBlankRequest'), 'info')}}
          >
            <Plus size={14} />
            {tr('newRequest')}
          </button>
          <div className="dropdown dropdown-end dropdown-bottom" style={{ display: 'flex' }}>
            <button
              tabIndex={0}
              role="button"
              className="btn-brand"
              style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '13px 8px', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: '1px solid rgba(255,255,255,0.2)' }}
            >
              <ChevronDown size={14} />
            </button>
            <ul tabIndex={0} className="dropdown-content menu p-1 shadow-lg" style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 6,
              minWidth: 140,
              zIndex: 9999,
            }}>
              <li>
                <a onClick={async (e) => {
                  e.preventDefault();
                  (document.activeElement as HTMLElement)?.blur()
                  const name = prompt(tr('newFolder'))
                  if (!name) return
                  await addWorkspaceFolder(name, null)
                  bumpWorkspace()
                  setSidebarTab('workspace')
                  showToast(tr('newFolder'), 'info')
                }} style={{ fontSize: 12 }}>
                  <Plus size={14} /> {tr('newFolder')}
                </a>
              </li>
              <li>
                <a onClick={(e) => {
                  e.preventDefault()
                  setShowCurlImport(true);
                  (document.activeElement as HTMLElement)?.blur()
                }} style={{ fontSize: 12 }}>
                  <Terminal size={14} /> {tr('importCurl')}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0" style={{ display: 'grid', gridTemplateRows: '1fr', overflow: 'hidden' }}>
        <div
          style={{
            gridArea: '1 / 1',
            overflow: 'auto',
            transform: effectiveTab === 'workspace' ? 'translateX(0)' : 'translateX(-24px)',
            opacity: effectiveTab === 'workspace' ? 1 : 0,
            pointerEvents: effectiveTab === 'workspace' ? 'auto' : 'none',
            transition: 'transform 0.2s ease, opacity 0.15s ease',
          }}
        >
          <WorkspaceTree />
        </div>
        <div
          style={{
            gridArea: '1 / 1',
            overflow: 'auto',
            transform: effectiveTab === 'history' ? 'translateX(0)' : 'translateX(24px)',
            opacity: effectiveTab === 'history' ? 1 : 0,
            pointerEvents: effectiveTab === 'history' ? 'auto' : 'none',
            transition: 'transform 0.2s ease, opacity 0.15s ease',
          }}
        >
          <HistoryList records={records} loading={loading} onReplay={handleReplay} onDelete={handleDeleteHistory} />
        </div>
      </div>
      <CurlImportModal
        open={showCurlImport}
        onClose={() => setShowCurlImport(false)}
      />
    </div>
  )
}
