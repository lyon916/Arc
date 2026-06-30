import { useState, useEffect, useRef } from 'react'
import { Plus, Settings, ChevronRight } from 'lucide-react'
import { useUiStore, useRequestStore, THEME_LIST } from '../../store'
import CodeGenerator from '../common/CodeGenerator'
import { UserMenu } from '../auth/UserMenu'
import { AuthModal } from '../auth/AuthModal'
import { useIsMobile } from '../../hooks/useIsMobile'
import { t } from '../../i18n'
import EnvModal from '../env/EnvModal'
import { getAllEnvs, activateEnv, deactivateEnv } from '../../hooks/useEnvironment'
import type { EnvRecord } from '../../db'

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
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null)
  const hoverTimerRef = useRef<number>(0)
  const [envs, setEnvs] = useState<EnvRecord[]>([])
  const [envModalOpen, setEnvModalOpen] = useState(false)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [])

  const tr = (key: string) => t[lang]?.[key] ?? key

  const handleMenuEnter = (menu: string) => {
    clearTimeout(hoverTimerRef.current)
    setHoveredMenu(menu)
  }

  const handleMenuLeave = () => {
    hoverTimerRef.current = window.setTimeout(() => setHoveredMenu(null), 100)
  }

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
              onClick={() => { resetRequest(); showToast(tr('newBlankRequest'), 'info'); setTimeout(() => document.getElementById('url-input')?.focus()) }}
            >
              <Plus size={14} />
            </button>
          )}

          <UserMenu />

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

          <button
            className="btn-ghost-linear"
            style={{ padding: isMobile ? undefined : '4px 10px', height: isMobile ? 26 : undefined, fontSize: 13 }}
            onClick={() => setShowCodegen(true)}
            title={tr('codeGen')}
          >
            {'</>'}
          </button>

          <div className="dropdown dropdown-end">
            <button
              tabIndex={0}
              role="button"
              className="btn-ghost-linear"
              style={{ padding: isMobile ? '0 5px' : '4px 8px', height: isMobile ? 26 : undefined, display: 'flex', alignItems: 'center' }}
              title={tr('settings')}
            >
              <Settings size={isMobile ? 16 : 18} />
            </button>
            <div
              tabIndex={0}
              className="dropdown-content hide-scrollbar"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-standard)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                zIndex: 100,
                width: 200,
                padding: '4px 0',
              }}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setTimeout(() => setHoveredMenu(null), 150)
                }
              }}
            >
              {/* Language */}
              <div
                style={{ position: 'relative' }}
                onMouseEnter={() => handleMenuEnter('lang')}
                onMouseLeave={handleMenuLeave}
              >
                <button
                  className="btn-ghost-linear"
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', fontSize: 13, borderRadius: 0, border: 'none',
                    color: 'var(--text-primary)', fontWeight: 400,
                  }}
                >
                  <span>{tr('language')}</span>
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                </button>
                {hoveredMenu === 'lang' && (
                  <div
                    style={{
                      position: 'absolute', right: '100%', top: 0,
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-standard)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                      zIndex: 101,
                      width: 140,
                      padding: '4px 0',
                    }}
                    onMouseEnter={() => handleMenuEnter('lang')}
                    onMouseLeave={handleMenuLeave}
                  >
                    <button
                      className="btn-ghost-linear"
                      style={{
                        display: 'flex', alignItems: 'center', width: '100%',
                        padding: '8px 12px', fontSize: 13, borderRadius: 0, border: 'none',
                        background: lang === 'zh' ? 'var(--accent-brand-light)' : 'transparent',
                        color: lang === 'zh' ? 'var(--accent-brand)' : 'var(--text-primary)',
                        fontWeight: lang === 'zh' ? 510 : 400,
                      }}
                      onClick={() => {
                        setLang('zh')
                        showToast(tr('languageChanged'), 'info', undefined, 2000)
                        ;(document.activeElement as HTMLElement)?.blur()
                      }}
                    >
                      <span>{tr('langZh')}</span>
                      {lang === 'zh' && <span style={{ marginLeft: 'auto', fontSize: 13 }}>&#10003;</span>}
                    </button>
                    <button
                      className="btn-ghost-linear"
                      style={{
                        display: 'flex', alignItems: 'center', width: '100%',
                        padding: '8px 12px', fontSize: 13, borderRadius: 0, border: 'none',
                        background: lang === 'en' ? 'var(--accent-brand-light)' : 'transparent',
                        color: lang === 'en' ? 'var(--accent-brand)' : 'var(--text-primary)',
                        fontWeight: lang === 'en' ? 510 : 400,
                      }}
                      onClick={() => {
                        setLang('en')
                        showToast(tr('languageChanged'), 'info', undefined, 2000)
                        ;(document.activeElement as HTMLElement)?.blur()
                      }}
                    >
                      <span>{tr('langEn')}</span>
                      {lang === 'en' && <span style={{ marginLeft: 'auto', fontSize: 13 }}>&#10003;</span>}
                    </button>
                  </div>
                )}
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: 0 }} />

              {/* Environment */}
              <div
                style={{ position: 'relative' }}
                onMouseEnter={() => {
                  handleMenuEnter('env')
                  if (envs.length === 0) getAllEnvs().then(setEnvs)
                }}
                onMouseLeave={handleMenuLeave}
              >
                <button
                  className="btn-ghost-linear"
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', fontSize: 13, borderRadius: 0, border: 'none',
                    color: 'var(--text-primary)', fontWeight: 400,
                  }}
                >
                  <span>{tr('environment')}</span>
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                </button>
                {hoveredMenu === 'env' && (
                  <div
                    style={{
                      position: 'absolute', right: '100%', top: 0,
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-standard)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                      zIndex: 101,
                      width: 180,
                      padding: '4px 0',
                    }}
                    onMouseEnter={() => handleMenuEnter('env')}
                    onMouseLeave={handleMenuLeave}
                  >
                    {envs.length === 0 ? (
                      <div style={{ padding: '6px 12px', fontSize: 12, color: 'var(--text-tertiary)' }}>{tr('noEnv')}</div>
                    ) : (
                      envs.map((env) => (
                        <button
                          key={env.id}
                          className="btn-ghost-linear"
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: 0, border: 'none',
                            color: env.isActive ? 'var(--accent-brand)' : 'var(--text-secondary)',
                            fontWeight: env.isActive ? 510 : 400,
                          }}
                          onClick={async () => {
                            if (env.isActive) {
                              await deactivateEnv()
                            } else {
                              await activateEnv(env.id!)
                            }
                            const all = await getAllEnvs()
                            setEnvs(all)
                            showToast(tr('envSwitched'), 'info')
                            ;(document.activeElement as HTMLElement)?.blur()
                          }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{env.name}</span>
                          {env.isActive && <span style={{ fontSize: 10, color: 'var(--status-success)', fontWeight: 510, marginLeft: 4, flexShrink: 0 }}>&#9679;</span>}
                        </button>
                      ))
                    )}
                    <button
                      className="btn-ghost-linear"
                      style={{
                        width: '100%', padding: '4px 12px', fontSize: 11,
                        color: 'var(--text-muted)', borderRadius: 0, border: 'none', marginTop: 4,
                      }}
                      onClick={() => setEnvModalOpen(true)}
                    >
                      {tr('envManagement')}...
                    </button>
                  </div>
                )}
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: 0 }} />

              {/* Theme */}
              <div
                style={{ position: 'relative' }}
                onMouseEnter={() => handleMenuEnter('theme')}
                onMouseLeave={handleMenuLeave}
              >
                <button
                  className="btn-ghost-linear"
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', fontSize: 13, borderRadius: 0, border: 'none',
                    color: 'var(--text-primary)', fontWeight: 400,
                  }}
                >
                  <span>{tr('theme')}</span>
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                </button>
                {hoveredMenu === 'theme' && (
                  <div
                    style={{
                      position: 'absolute', right: '100%', top: 0,
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-standard)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                      zIndex: 101,
                      width: 220,
                      padding: '4px 0',
                    }}
                    onMouseEnter={() => handleMenuEnter('theme')}
                    onMouseLeave={handleMenuLeave}
                  >
                    <div style={{ maxHeight: 240, overflowY: 'auto', overflowX: 'hidden', padding: '0 0 4px' }}>
                      {THEME_LIST.map((item) => (
                        <button
                          key={item.name}
                          className="btn-ghost-linear"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                            padding: '8px 12px', borderRadius: 0, border: 'none',
                            background: theme === item.name ? 'var(--accent-brand-light)' : 'transparent',
                            color: theme === item.name ? 'var(--accent-brand-hover)' : 'var(--text-secondary)',
                            fontWeight: theme === item.name ? 510 : 400, fontSize: 13,
                          }}
                          onClick={() => {
                            setTheme(item.name)
                            showToast(tr('themeChanged'), 'info', undefined, 2000)
                            ;(document.activeElement as HTMLElement)?.blur()
                          }}
                        >
                          <span style={{ fontSize: 14 }}>{item.icon}</span>
                          <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                          <span style={{ width: 12, height: 12, borderRadius: 3, background: item.preview, border: '1px solid var(--border-strong)' }} />
                          {theme === item.name && <span style={{ marginLeft: 4, fontSize: 13, color: 'var(--accent-brand)' }}>&#10003;</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      <CodeGenerator open={showCodegen} onClose={() => setShowCodegen(false)} />
      <EnvModal open={envModalOpen} onClose={() => { setEnvModalOpen(false); getAllEnvs().then(setEnvs) }} />
      <AuthModal />
    </>
  )
}
