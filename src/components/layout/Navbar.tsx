import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { useUiStore, useRequestStore, THEME_LIST } from '../../store'
import EnvSelector from '../env/EnvSelector'
import CodeGenerator from '../common/CodeGenerator'
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
            title="Switch Language"
          >
            {lang === 'zh' ? 'EN' : '中'}
          </button>
        </div>
      </div>

      <CodeGenerator open={showCodegen} onClose={() => setShowCodegen(false)} />
    </>
  )
}
