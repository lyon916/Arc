import { useRequestStore, useUiStore } from '../../store'
import { t } from '../../i18n'
import { FileText } from 'lucide-react'

export default function DocsEditor() {
  const meta = useRequestStore((s) => s.openapiMeta)
  const lang = useUiStore((s) => s.lang)
  const tr = (key: string) => t[lang]?.[key] ?? key

  if (!meta) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 16px',
        color: 'var(--text-tertiary)',
        fontSize: 13,
        gap: 12,
        textAlign: 'center',
      }}>
        <FileText size={32} opacity={0.3} />
        <span>{tr('noOpenApiDocs')}</span>
      </div>
    )
  }

  return (
    <div style={{ padding: '12px 8px', fontSize: 13, lineHeight: 1.7, overflowY: 'auto', height: '100%' }}>
      {/* Description */}
      {meta.description && (
        <div>
          <div style={{
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {meta.description}
          </div>
        </div>
      )}

      {/* Parameter descriptions */}
      {meta.paramDescriptions && Object.keys(meta.paramDescriptions).length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{
            fontWeight: 510,
            fontSize: 11,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 8,
          }}>
            {tr('params')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(meta.paramDescriptions).map(([name, desc]) => (
              <div key={name} style={{
                padding: '6px 8px',
                borderRadius: 6,
                background: 'var(--bg-hover)',
              }}>
                <code style={{
                  fontSize: 12,
                  color: 'var(--accent-brand)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {name}
                </code>
                <span style={{
                  color: 'var(--text-secondary)',
                  marginLeft: 8,
                  fontSize: 12,
                }}>
                  {desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source info */}
      {meta.sourceUrl && (
        <div style={{
          marginTop: 16,
          fontSize: 11,
          color: 'var(--text-tertiary)',
          paddingTop: 12,
          borderTop: '1px solid var(--border-subtle)',
        }}>
          Source: <code style={{ fontSize: 11 }}>{meta.sourceUrl}</code>
        </div>
      )}
    </div>
  )
}
