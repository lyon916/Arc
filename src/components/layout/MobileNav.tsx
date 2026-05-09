import { Globe, ArrowDownUp, Clock, FolderOpen } from 'lucide-react'
import { useUiStore } from '../../store'
import { t } from '../../i18n'

export type MobileTab = 'request' | 'response' | 'history' | 'workspace'

interface Props {
  active: MobileTab
  onChange: (tab: MobileTab) => void
  hasResponse: boolean
}

export function MobileNav({ active, onChange, hasResponse }: Props) {
  const lang = useUiStore((s) => s.lang)
  const tr = (key: string) => t[lang]?.[key] ?? key

  const tabs: { key: MobileTab; labelKey: string; icon: typeof Globe }[] = [
    { key: 'request', labelKey: 'requests', icon: Globe },
    { key: 'response', labelKey: 'response', icon: ArrowDownUp },
    { key: 'history', labelKey: 'history', icon: Clock },
    { key: 'workspace', labelKey: 'workspace', icon: FolderOpen },
  ]

  return (
    <nav
      style={{
        display: 'flex',
        height: 48,
        background: 'var(--bg-panel)',
        borderTop: '1px solid var(--border-subtle)',
        flexShrink: 0,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {tabs.map(({ key, labelKey, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            border: 'none',
            background: 'transparent',
            color: active === key ? 'var(--accent-brand)' : 'var(--text-tertiary)',
            cursor: 'pointer',
            padding: '6px 4px',
            fontSize: 10,
            fontWeight: active === key ? 590 : 400,
            fontFamily: 'var(--font-primary)',
            transition: 'color var(--transition-fast)',
            position: 'relative',
          }}
        >
          <Icon size={20} strokeWidth={active === key ? 2.5 : 1.8} />
          <span>{tr(labelKey)}</span>
          {key === 'response' && hasResponse && (
            <span
              style={{
                position: 'absolute',
                top: 4,
                right: 'calc(50% - 20px)',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--status-success)',
              }}
            />
          )}
        </button>
      ))}
    </nav>
  )
}
