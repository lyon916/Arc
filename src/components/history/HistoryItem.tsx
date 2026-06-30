import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { HistoryRecord } from '../../db'
import Tooltip from '../common/Tooltip'
import { cleanUrlDisplay, methodLower, statusClass } from '../../utils/shared'
import { useUiStore } from '../../store'
import { t } from '../../i18n'

interface Props {
  record: HistoryRecord
  selected: boolean
  onClick: () => void
  onDelete: () => void
}

export function HistoryItem({ record, selected, onClick, onDelete }: Props) {
  const { request, response, createdAt } = record
  const mKey = methodLower[request.method] || 'head'
  const time = new Date(createdAt).toLocaleTimeString()
  const [hovering, setHovering] = useState(false)
  const lang = useUiStore((s) => s.lang)
  const tr = (key: string) => t[lang]?.[key] ?? key

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 10px',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        fontFeatureSettings: '"cv01", "ss03"',
        transition: 'background var(--transition-normal)',
        background: selected ? 'var(--accent-brand-light)' : hovering ? 'var(--bg-hover)' : 'transparent',
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={onClick}
    >
      {/* method标签 */}
      <span
        className={`method-${mKey}-bg`}
        style={{
          borderRadius: '6px',
          fontWeight: 510,
          fontSize: '10px',
          padding: '2px 6px',
          lineHeight: '1.4',
          whiteSpace: 'nowrap',
        }}
      >
        {request.method}
      </span>

      {/* URL */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Tooltip text={request.url || ''}>
          <span
            style={{
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
            }}
          >
            {cleanUrlDisplay(request.url || '') || tr('noUrl')}
          </span>
        </Tooltip>
      </div>

      {/* status */}
      {response && (
        <span
          className={statusClass(response.status)}
          style={{
            fontWeight: 510,
            fontSize: '12px',
            whiteSpace: 'nowrap',
          }}
        >
          {response.status}
        </span>
      )}

      {/* 时间 */}
      <span
        style={{
          color: 'var(--text-muted)',
          fontSize: '12px',
          whiteSpace: 'nowrap',
        }}
      >
        {time}
      </span>

      {/* delete */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        style={{
          width: 24,
          height: 24,
          visibility: hovering ? 'visible' : 'hidden',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
          background: 'transparent',
          color: 'var(--text-tertiary)',
          flexShrink: 0,
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--status-error)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)' }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}