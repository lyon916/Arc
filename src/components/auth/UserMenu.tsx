import { useState } from 'react'
import { LogIn, LogOut, RefreshCw, User } from 'lucide-react'
import { useAuthStore, useUiStore, type SyncStatus } from '../../store'
import { useAuth } from '../../hooks/useAuth'
import { t } from '../../i18n'

function SyncIcon({ status }: { status: SyncStatus }) {
  if (status === 'syncing') {
    return <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-tertiary)' }} />
  }
  if (status === 'ok') {
    return <span style={{ fontSize: 8, color: 'var(--status-success)' }}>●</span>
  }
  if (status === 'error') {
    return <span style={{ fontSize: 8, color: 'var(--status-error)' }}>●</span>
  }
  return null
}

export function UserMenu() {
  const user = useAuthStore((s) => s.user)
  const syncStatus = useAuthStore((s) => s.syncStatus)
  const setAuthModalOpen = useAuthStore((s) => s.setAuthModalOpen)
  const lang = useUiStore((s) => s.lang)
  const tr = (key: string) => t[lang]?.[key] ?? key
  const showToast = useUiStore((s) => s.showToast)
  const { logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  if (!user) {
    return (
      <button
        className="btn-ghost-linear flex items-center gap-1"
        style={{ padding: '4px 10px', fontSize: '12px', flexShrink: 0 }}
        onClick={() => setAuthModalOpen(true)}
      >
        <LogIn size={14} />
        {tr('login')}
      </button>
    )
  }

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        className="btn-ghost-linear flex items-center gap-1"
        style={{ padding: '4px 8px', fontSize: '12px' }}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {user.avatar ? (
          <img src={user.avatar} alt="" style={{ width: 18, height: 18, borderRadius: '50%' }} />
        ) : (
          <User size={16} />
        )}
        <span style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.nickname || user.email || tr('user')}
        </span>
        <SyncIcon status={syncStatus} />
      </button>

      {menuOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 100 }}
            onClick={() => setMenuOpen(false)}
          />
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            zIndex: 101,
            minWidth: 160,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-standard)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            padding: 4,
          }}>
            <div style={{
              padding: '6px 12px',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: 12,
              color: 'var(--text-secondary)',
            }}>
              {user.email || user.nickname}
              {user.plan && (
                <span style={{
                  marginLeft: 8,
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-sm)',
                  background: user.plan === 'pro' ? 'var(--accent-brand)' : 'var(--bg-hover)',
                  color: user.plan === 'pro' ? 'white' : 'var(--text-tertiary)',
                  fontSize: 10,
                  fontWeight: 590,
                }}>
                  {user.plan.toUpperCase()}
                </span>
              )}
            </div>
            <button
              className="btn-ghost-linear"
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', fontSize: 12 }}
              onClick={() => { setMenuOpen(false); logout(); showToast(tr('logoutSuccess'), 'success') }}
            >
              <LogOut size={14} />
              {tr('logout')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
