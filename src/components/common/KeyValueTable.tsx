import { useCallback } from 'react'
import type { KeyValue } from '../../types/api'
import { useUiStore } from '../../store'
import { t } from '../../i18n'

interface Props {
  items: KeyValue[]
  onChange: (items: KeyValue[]) => void
  keyPlaceholder?: string
  valuePlaceholder?: string
}

export function KeyValueTable({ items, onChange, keyPlaceholder = 'Key', valuePlaceholder = 'Value' }: Props) {
  const lang = useUiStore((s) => s.lang)
  const tr = (key: string) => t[lang]?.[key] ?? key
  const addRow = useCallback(() => {
    onChange([...items, { key: '', value: '', enabled: true }])
  }, [items, onChange])

  const removeRow = useCallback((index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }, [items, onChange])

  const updateRow = useCallback((index: number, field: keyof KeyValue, value: string | boolean) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    onChange(updated)
  }, [items, onChange])

  return (
    <div className="flex flex-col" style={{ fontSize: 12 }}>
      {items.map((item, i) => (
        <div
          key={i}
          className="flex gap-2 items-center py-1.5 px-1"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={item.enabled}
            onChange={(e) => updateRow(i, 'enabled', e.target.checked)}
            style={{
              width: 14,
              height: 14,
              accentColor: 'var(--accent-brand)',
              cursor: 'pointer',
              borderRadius: 'var(--radius-sm)',
            }}
          />

          {/* Key input */}
          <input
            type="text"
            className="input-linear flex-1"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12, padding: '5px 8px' }}
            placeholder={keyPlaceholder}
            value={item.key}
            onChange={(e) => updateRow(i, 'key', e.target.value)}
          />

          {/* Value input */}
          <input
            type="text"
            className="input-linear flex-1"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12, padding: '5px 8px' }}
            placeholder={valuePlaceholder}
            value={item.value}
            onChange={(e) => updateRow(i, 'value', e.target.value)}
          />

          {/* Delete button */}
          <button
            onClick={() => removeRow(i)}
            className="flex items-center justify-center w-5 h-5 rounded transition-colors"
            style={{ color: 'var(--text-tertiary)', fontSize: 11 }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--status-error)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)' }}
          >
            ✕
          </button>
        </div>
      ))}

      {/* Add row button */}
      <button
        className="btn-ghost-linear mt-2 px-3 py-1.5 text-xs font-weight-510"
        onClick={addRow}
      >
        {tr('addRow')}
      </button>
    </div>
  )
}