import { useState, useMemo } from 'react'
import { Clock, Search } from 'lucide-react'
import type { HistoryRecord } from '../../db'
import { HistoryItem } from './HistoryItem'
import { useUiStore } from '../../store'
import { t } from '../../i18n'

interface Props {
  records: HistoryRecord[]
  loading: boolean
  onReplay: (req: HistoryRecord) => void
  onDelete: (id: number) => void
}

export function HistoryList({ records, loading, onReplay, onDelete }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const lang = useUiStore((s) => s.lang)
  const tr = (key: string) => t[lang]?.[key] ?? key

  const filtered = useMemo(() => {
    if (!query.trim()) return records
    const q = query.toLowerCase()
    return records.filter((r) =>
      r.request.url.toLowerCase().includes(q) ||
      r.request.method.toLowerCase().includes(q)
    )
  }, [records, query])

  const handleClick = (r: HistoryRecord) => {
    if (selectedId === r.id) {
      setSelectedId(null)
      return
    }
    setSelectedId(r.id!)
    onReplay(r)
  }

  if (loading && records.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 0',
        color: 'var(--text-tertiary)',
      }}>
        <svg width="20" height="20" viewBox="0 0 20 20" className="animate-spin">
          <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="24 10" strokeLinecap="round" />
        </svg>
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 0',
        gap: 8,
        color: 'var(--text-tertiary)',
        fontSize: '13px',
        fontFeatureSettings: '"cv01", "ss03"',
      }}>
        <Clock size={24} opacity={0.4} />
        {tr('noHistory')}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '4px 4px 6px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="input-linear"
            placeholder={tr('searchHistory')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: 28, paddingTop: 6, paddingBottom: 6, fontSize: 12 }}
          />
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {filtered.length === 0 ? (
          <div style={{
            color: 'var(--text-tertiary)',
            fontSize: 12,
            textAlign: 'center',
            padding: '16px 0',
          }}>
            {tr('noResults')}
          </div>
        ) : (
          filtered.map((r) => (
            <HistoryItem key={r.id} record={r} selected={r.id === selectedId} onClick={() => handleClick(r)} onDelete={() => onDelete(r.id!)} />
          ))
        )}
      </div>
    </div>
  )
}