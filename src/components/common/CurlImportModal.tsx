import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { parseCurl } from '../../utils/curlParser'
import { parseUrl } from '../../utils/urlParser'
import { useRequestStore, useUiStore } from '../../store'
import { ModalTransition } from './ModalTransition'
import { t } from '../../i18n'

function isUrl(text: string): boolean {
  const trimmed = text.trim()
  return trimmed.startsWith('http://') || trimmed.startsWith('https://')
}

interface Props {
  open: boolean
  onClose: () => void
}

export default function CurlImportModal({ open, onClose }: Props) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const loadRequest = useRequestStore((s) => s.loadRequest)
  const showToast = useUiStore((s) => s.showToast)
  const lang = useUiStore((s) => s.lang)
  const tr = (key: string) => t[lang]?.[key] ?? key

  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 100)
  }, [open])

  const handleImport = () => {
    if (!text.trim()) {
      showToast(tr('pleaseInputCurl'), 'error')
      return
    }
    try {
      if (isUrl(text)) {
        const req = parseUrl(text)
        if (!req.url) {
          showToast(tr('cannotParseUrl'), 'error')
          return
        }
        loadRequest(req)
        showToast(tr('importedFromUrl'), 'success')
      } else {
        const req = parseCurl(text)
        if (!req.url) {
          showToast(tr('cannotParseUrl'), 'error')
          return
        }
        loadRequest(req)
        showToast(tr('importedFromCurl'), 'success')
      }
      setText('')
      onClose()
    } catch {
      showToast(tr('formatError'), 'error')
    }
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
            {tr('importCurl')}
          </span>
          <button className="btn btn-sm btn-ghost" onClick={onClose} style={{ padding: '4px 8px' }}>
            <X size={16} />
          </button>
        </div>

        {/* 输入区 */}
        <textarea
          ref={textareaRef}
          className="input-linear"
          style={{
            margin: '12px 20px',
            padding: '12px',
            flex: 1,
            minHeight: '160px',
            resize: 'vertical',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            lineHeight: '1.5',
          }}
          placeholder={'粘贴 cURL 命令或 URL 链接，例如：\ncurl -X POST https://api.example.com/data -H \'Content-Type: application/json\' -d \'{"key":"value"}\'\n或 https://api.example.com/data?page=1&limit=10'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault()
              handleImport()
            }
          }}
        />

        {/* 底部 */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '12px 20px',
          borderTop: '1px solid var(--border-subtle)',
        }}>
          <button
            className="btn-brand"
            style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 510 }}
            onClick={handleImport}
          >
            {tr('import_')}
          </button>
        </div>
      </div>
    </ModalTransition>
  )
}