import { useRequestStore, useUiStore } from '../../store'
import { KeyValueTable } from '../common/KeyValueTable'
import { t } from '../../i18n'

export function ParamsEditor() {
  const request = useRequestStore((s) => s.request)
  const setQueryParams = useRequestStore((s) => s.setQueryParams)
  const lang = useUiStore((s) => s.lang)
  const tr = (key: string) => t[lang]?.[key] ?? key

  return (
    <KeyValueTable
      items={request.queryParams}
      onChange={setQueryParams}
      keyPlaceholder={tr('paramName')}
      valuePlaceholder={tr('paramValue')}
    />
  )
}