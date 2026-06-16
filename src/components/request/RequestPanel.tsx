import { useState } from 'react'
import { UrlBar } from './UrlBar'
import { HeadersEditor } from './HeadersEditor'
import { ParamsEditor } from './ParamsEditor'
import { BodyEditor } from './BodyEditor'
import AuthEditor from './AuthEditor'
import DocsEditor from './DocsEditor'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useUiStore } from '../../store'
import { t } from '../../i18n'

const tabs = ['Params', 'Headers', 'Body', 'Auth', 'Docs'] as const
type TabName = typeof tabs[number]

export function RequestPanel() {
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState<TabName>('Headers')
  const lang = useUiStore((s) => s.lang)
  const tr = (key: string) => t[lang]?.[key] ?? key

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-canvas)', padding: isMobile ? '8px' : '12px', gap: isMobile ? '6px' : '8px' }}>
      <UrlBar />

      {/* Tab bar */}
      <div
        className="flex gap-0 items-center flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab-linear ${activeTab === tab ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tr(tab.toLowerCase())}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'Params' && <ParamsEditor />}
        {activeTab === 'Headers' && <HeadersEditor />}
        {activeTab === 'Body' && <BodyEditor />}
        {activeTab === 'Auth' && <AuthEditor />}
        {activeTab === 'Docs' && <DocsEditor />}
      </div>
    </div>
  )
}