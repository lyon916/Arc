import { useState } from 'react'
import { X } from 'lucide-react'
import type { ApiRequest } from '../../types/api'
import { useRequestStore, useUiStore } from '../../store'
import { t } from '../../i18n'
import { toCurl, toPython, toFetch, toGo } from '../../utils/codegen'
import { ModalTransition } from './ModalTransition'

interface Props {
  open: boolean
  onClose: () => void
}

const tabs = ['cURL', 'Python', 'fetch', 'Go'] as const
type Tab = (typeof tabs)[number]

const generators: Record<Tab, (req: ApiRequest) => string> = {
  cURL: toCurl,
  Python: toPython,
  fetch: toFetch,
  Go: toGo,
}

export default function CodeGenerator({ open, onClose }: Props) {
  const request = useRequestStore((s) => s.request)
  const [tab, setTab] = useState<Tab>('cURL')
  const [copied, setCopied] = useState(false)
  const lang = useUiStore((s) => s.lang)
  const tr = (key: string) => t[lang]?.[key] ?? key

  const code = generators[tab](request)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <ModalTransition open={open} onClose={onClose}>
      <div
        style={{
          width: '680px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          fontFeatureSettings: '"cv01", "ss03"',
        }}
      >
        {/* 标题 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <span style={{
            fontWeight: 590,
            fontSize: '14px',
            color: 'var(--text-primary)',
          }}>
            生成代码
          </span>
          <button className="btn btn-sm btn-ghost" onClick={onClose} style={{ padding: '4px 8px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          padding: '8px 20px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          {tabs.map((t) => (
            <button
              key={t}
              className={`tab-linear ${tab === t ? 'tab-active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* 代码区 */}
        <div className="code-block" style={{
          margin: '12px 20px',
          padding: '16px',
          flex: 1,
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
        }}>
          {code}
        </div>

        {/* 底部 */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '12px 20px',
          borderTop: '1px solid var(--border-subtle)',
        }}>
          <button
            className="btn-brand"
            style={{ padding: '8px 10px', fontSize: '13px', fontWeight: 510 }}
            onClick={handleCopy}
          >
            {copied ? tr('copied') : tr('copyCode')}
          </button>
        </div>
      </div>
    </ModalTransition>
  )
}
