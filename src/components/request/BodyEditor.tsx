import { useMemo } from 'react'
import { useRequestStore, useUiStore } from '../../store'
import { KeyValueTable } from '../common/KeyValueTable'
import type { BodyType } from '../../types/api'
import { t } from '../../i18n'

export function BodyEditor() {
  const request = useRequestStore((s) => s.request)
  const setBodyType = useRequestStore((s) => s.setBodyType)
  const setBodyJson = useRequestStore((s) => s.setBodyJson)
  const setBodyFormData = useRequestStore((s) => s.setBodyFormData)
  const setBodyRaw = useRequestStore((s) => s.setBodyRaw)
  const lang = useUiStore((s) => s.lang)
  const tr = (key: string) => t[lang]?.[key] ?? key

  // 防御旧数据中可能缺失的字段
  const bodyJson = request.bodyJson ?? ''
  const bodyRaw = request.bodyRaw ?? ''

  const bodyTypes = useMemo(() => [
    { value: 'none' as BodyType, label: tr('noneLabel') },
    { value: 'json' as BodyType, label: tr('jsonLabel') },
    { value: 'formdata' as BodyType, label: tr('formDataLabel') },
    { value: 'raw' as BodyType, label: tr('raw') },
  ], [tr])

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
            placeholder={tr('jsonExample')}
            value={bodyJson}
            onChange={(e) => setBodyJson(e.target.value)}
            spellCheck={false}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {(() => {
              if (!bodyJson.trim()) return null
              try { JSON.parse(bodyJson); return null } catch {
                return <span style={{ color: 'var(--status-error)', fontSize: 11 }}>{tr('jsonError')}</span>
              }
            })()}
            {bodyJson.trim() && (
              <button
                className="btn-ghost-linear"
                style={{ fontSize: 11, padding: '2px 8px', marginLeft: 'auto' }}
                onClick={() => {
                  try {
                    setBodyJson(JSON.stringify(JSON.parse(bodyJson), null, 2))
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
          placeholder={tr('rawTextHint')}
          value={bodyRaw}
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