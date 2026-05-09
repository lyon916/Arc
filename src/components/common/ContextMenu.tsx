import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface MenuItem {
  label: ReactNode
  action: () => void
  danger?: boolean
}

interface Props {
  x: number
  y: number
  items: MenuItem[]
  onClose: () => void
}

function clamp(val: number, max: number, size: number) {
  return val + size > max ? max - size - 8 : val
}

export default function ContextMenu({ x, y, items, onClose }: Props) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const menuW = 180
  const menuY = clamp(y, vh, items.length * 34 + 16)

  return createPortal(
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 999 }}
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose() }}
      />
      <div
        className="animate-scale-in"
        style={{
          position: 'fixed',
          left: clamp(x, vw, menuW),
          top: menuY,
          zIndex: 1000,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-standard)',
          borderRadius: 'var(--radius-md)',
          padding: '4px',
          minWidth: '160px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}
      >
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => { item.action(); onClose() }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '6px 12px',
              fontSize: 13,
              background: 'transparent',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              color: item.danger ? 'var(--status-error)' : 'var(--text-secondary)',
              fontWeight: 400,
              fontFeatureSettings: '"cv01", "ss03"',
              transition: 'all var(--transition-normal)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>,
    document.body
  )
}
