import { useRequestStore, useUiStore } from '../../store'
import { KeyValueTable } from '../common/KeyValueTable'
import type { BodyType } from '../../types/api'
import { t } from '../../i18n'

const bodyTypes: { value: BodyType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'json', label: 'JSON' },
  { value: 'formdata', label: 'Form Data' },
  { value: 'raw', label: 'Raw' },
]

export function BodyEditor() {
  const request = useRequestStore((s) => s.request)
  const setBodyType = useRequestStore((s) => s.setBodyType)
  const setBodyJson = useRequestStore((s) => s.setBodyJson)
  const setBodyFormData = useRequestStore((s) => s.setBodyFormData)
  const setBodyRaw = useRequestStore((s) => s.setBodyRaw)
  const lang = useUiStore((s) => s.lang)
  const tr = (key: string) => t[lang]?.[key] ?? key

  return (
    <div className="flex flex-col gap-2 animate-fade-in">
      {/* Type selector */}
      <div className="flex gap-0">
        {bodyTypes.map((bt) => (
          <button
            key={bt.value}
            className={`tab-linear ${request.bodyType === bt.value ? 'tab-active' : ''}`}
            onClick={() => setBodyType(bt.value)}
          >
            {bt.label}
          </button>
        ))}
      </div>

      {/* JSON */}
      {request.bodyType === 'json' && (
        <div className="flex flex-col gap-1 animate-fade-in">
          <textarea
            className="input-linear w-full min-h-[200px] resize-y"
            style={{ fontFamily: 'var(--font-mono)' }}
            placeholder='{ "key": "value" }'
            value={request.bodyJson}
            onChange={(e) => setBodyJson(e.target.value)}
            spellCheck={false}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {(() => {
              if (!request.bodyJson.trim()) return null
              try { JSON.parse(request.bodyJson); return null } catch {
                return <span style={{ color: 'var(--status-error)', fontSize: 11 }}>{tr('jsonError')}</span>
              }
            })()}
            {request.bodyJson.trim() && (
              <button
                className="btn-ghost-linear"
                style={{ fontSize: 11, padding: '2px 8px', marginLeft: 'auto' }}
                onClick={() => {
                  try {
                    setBodyJson(JSON.stringify(JSON.parse(request.bodyJson), null, 2))
                  } catch { /* ignore */ }
                }}
              >
                {tr('format')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* FormData */}
      {request.bodyType === 'formdata' && (
        <div className="animate-fade-in">
          <KeyValueTable
            items={request.bodyFormData}
            onChange={setBodyFormData}
            keyPlaceholder={tr('fieldName')}
            valuePlaceholder={tr('fieldValue')}
          />
        </div>
      )}

      {/* Raw */}
      {request.bodyType === 'raw' && (
        <textarea
          className="input-linear w-full min-h-[200px] resize-y animate-fade-in"
          style={{ fontFamily: 'var(--font-mono)' }}
          placeholder="Raw text..."
          value={request.bodyRaw}
          onChange={(e) => setBodyRaw(e.target.value)}
          spellCheck={false}
        />
      )}

      {/* None */}
      {request.bodyType === 'none' && (
        <p
          className="text-center py-6 animate-fade-in"
          style={{ color: 'var(--text-tertiary)', fontSize: 13 }}
        >
          {tr('noBody')}
        </p>
      )}
    </div>
  )
}