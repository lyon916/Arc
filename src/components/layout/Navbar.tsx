import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { useUiStore, useRequestStore, THEME_LIST } from '../../store'
import EnvSelector from '../env/EnvSelector'
import CodeGenerator from '../common/CodeGenerator'
import { UserMenu } from '../auth/UserMenu'
import { AuthModal } from '../auth/AuthModal'
import { useIsMobile } from '../../hooks/useIsMobile'
import { t } from '../../i18n'

export function Navbar() {
  const isMobile = useIsMobile()
  const toggleSidebar = useUiStore((s) => s.setSidebarOpen)
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const theme = useUiStore((s) => s.theme)
  const setTheme = useUiStore((s) => s.setTheme)
  const resetRequest = useRequestStore((s) => s.resetRequest)
  const showToast = useUiStore((s) => s.showToast)
  const lang = useUiStore((s) => s.lang)
  const setLang = useUiStore((s) => s.setLang)
  const [showCodegen, setShowCodegen] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [])

  const currentTheme = THEME_LIST.find((t) => t.name === theme)
  const tr = (key: string) => t[lang]?.[key] ?? key

  return (
    <>
      <div
        style={{
          height: isMobile ? 34 : 44,
          background: 'var(--bg-panel)',
          borderBottom: '1px solid var(--border-subtle)',
          paddingRight: isMobile ? 8 : 12,
          paddingTop: isMobile ? 4 : 0,
          paddingBottom: isMobile ? 4 : 0,
        }}
        className="flex items-center gap-1 pl-4"
      >
        {!isMobile && (
        <label className="btn-ghost-linear swap swap-rotate" style={{ padding: 4, borderRadius: 'var(--radius-md)' }}>
          <input
            type="checkbox"
            checked={sidebarOpen}
            onChange={() => toggleSidebar(!sidebarOpen)}
          />
          <svg className="swap-off fill-current" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 512 512">
            <path d="M64,384H448V341.33H64Zm0-106.67H448V234.67H64ZM64,128v42.67H448V128Z" />
          </svg>
          <svg className="swap-on fill-current" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 512 512">
            <polygon points="400 145.49 366.51 112 256 222.51 145.49 112 112 145.49 222.51 256 112 366.51 145.49 400 256 289.49 366.51 400 400 366.51 289.49 256 400 145.49" />
          </svg>
        </label>
        )}

        <span
          style={{
            fontWeight: 590,
            fontSize: isMobile ? 13 : 14,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            fontFeatureSettings: '"cv01", "ss03"',
          }}
          className={isMobile ? '' : 'ml-3'}
        >
          <img src="/favicon.svg" alt="Arc" className="w-6 h-6 inline-block" />
          <span className="ml-2">Arc</span>
        </span>

        <div className="flex items-center ml-auto" style={{ gap: isMobile ? 2 : 8 }}>
          {isMobile && (
            <button
              className="btn-brand flex items-center justify-center"
              style={{ padding: '0 8px', height: 26, minWidth: 26 }}
              onClick={() => { resetRequest(); showToast(tr('newBlankRequest'), 'info') }}
            >
              <Plus size={14} />
            </button>
          )}

          <a
            href="https://github.com/lyon916/Arc"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost-linear"
            style={{ padding: isMobile ? '0 5px' : '4px 8px', height: isMobile ? 26 : undefined, display: 'flex', alignItems: 'center' }}
            title="GitHub"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </a>

          <div className="dropdown dropdown-end">
            <button
              tabIndex={0}
              role="button"
              className="btn-ghost-linear"
              style={{ padding: isMobile ? '0 5px' : '4px 10px', height: isMobile ? 26 : undefined, fontSize: 13, display: 'flex', alignItems: 'center', gap: '4px' }}
              title={tr('theme')}
            >
              <span>{currentTheme?.icon}</span>
              {!isMobile && <span style={{ fontSize: '12px', fontFeatureSettings: '"cv01", "ss03"' }}>{currentTheme?.label}</span>}
            </button>
            <ul
              tabIndex={0}
              className="dropdown-content menu p-1 hide-scrollbar theme-dropdown"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-standard)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                zIndex: 100,
                minWidth: '180px',
                maxHeight: '360px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ overflowY: 'auto', scrollbarWidth: 'none', overscrollBehavior: 'contain', flex: 1 }}>
              {THEME_LIST.map((t) => (
                <li key={t.name}>
                  <a
                    onClick={() => { setTheme(t.name); (document.activeElement as HTMLElement)?.blur() }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                      background: theme === t.name ? 'var(--accent-brand-light)' : 'transparent',
                      color: theme === t.name ? 'var(--accent-brand-hover)' : 'var(--text-secondary)',
                      fontWeight: theme === t.name ? 510 : 400,
                      fontSize: '13px', fontFeatureSettings: '"cv01", "ss03"',
                    }}
                  >
                    <span style={{ fontSize: '14px' }}>{t.icon}</span>
                    <span>{t.label}</span>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: t.preview, border: '1px solid var(--border-strong)', marginLeft: 'auto' }} />
                  </a>
                </li>
              ))}
              </div>
            </ul>
          </div>

          <EnvSelector />

          <UserMenu />

          <button
            className="btn-ghost-linear"
            style={{ padding: isMobile ? undefined : '4px 10px', height: isMobile ? 26 : undefined, fontSize: 13 }}
            onClick={() => setShowCodegen(true)}
            title={tr('codeGen')}
          >
            {'</>'}
          </button>

          {/* Language toggle */}
          <button
            className="btn-ghost-linear"
            style={{ padding: isMobile ? '0 5px' : '4px 8px', height: isMobile ? 26 : undefined, fontSize: 12, fontWeight: 590 }}
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            title={String(tr('switchLang'))}
          >
            {lang === 'zh' ? tr('langEn') : tr('langZh')}
          </button>
        </div>
      </div>

      <CodeGenerator open={showCodegen} onClose={() => setShowCodegen(false)} />
      <AuthModal />
    </>
  )
}
