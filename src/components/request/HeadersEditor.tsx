import { useRequestStore, useUiStore } from '../../store'
import { KeyValueTable } from '../common/KeyValueTable'
import { t } from '../../i18n'

export function HeadersEditor() {
  const request = useRequestStore((s) => s.request)
  const setHeaders = useRequestStore((s) => s.setHeaders)
  const lang = useUiStore((s) => s.lang)
  const tr = (key: string) => t[lang]?.[key] ?? key

  return (
    <KeyValueTable
      items={request.headers}
      onChange={setHeaders}
      keyPlaceholder={tr('keyPlaceholder')}
      valuePlaceholder={tr('valuePlaceholder')}
    />
  )
}