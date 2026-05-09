import type { ReactNode } from 'react'
import { useUiStore } from '../../store'
import { t } from '../../i18n'

export function NotFound(): ReactNode {
  const lang = useUiStore((s) => s.lang)
  const tr = (key: string) => t[lang]?.[key] ?? key
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '16px',
        padding: '24px',
        background: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-primary)',
      }}
    >
      <div style={{ fontSize: '72px' }}>🔭</div>
      <h1 style={{ fontSize: '72px', fontWeight: 700, margin: 0, color: 'var(--accent-brand)' }}>
        404
      </h1>
      <p style={{ fontSize: '16px', color: 'var(--text-secondary)', margin: 0 }}>
        {tr('notFound')}
      </p>
      <a
        href="/"
        style={{
          padding: '10px 24px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--accent-brand)',
          color: '#fff',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: 510,
          fontFamily: 'var(--font-primary)',
        }}
      >
        {tr('backHome')}
      </a>
    </div>
  )
}
