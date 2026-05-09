import type { ApiRequest, KeyValue } from '../types/api'
import { defaultRequest } from './shared'

interface PostmanItem {
  name?: string
  item?: PostmanItem[]
  request?: {
    method?: string
    url?: string | { raw?: string }
    header?: Array<{ key?: string; value?: string; disabled?: boolean }>
    body?: {
      mode?: string
      raw?: string
    }
  }
}

interface PostmanCollection {
  info?: { name?: string }
  item?: PostmanItem[]
}

function extractItems(items: PostmanItem[]): PostmanItem[] {
  const result: PostmanItem[] = []
  for (const item of items) {
    if (item.item) result.push(...extractItems(item.item))
    else if (item.request) result.push(item)
  }
  return result
}

export function parsePostmanCollection(json: string): ApiRequest[] {
  const col: PostmanCollection = JSON.parse(json)
  if (!col.item?.length) return []
  const flat = extractItems(col.item)
  return flat.map(({ request }) => {
    if (!request) return { ...defaultRequest }
    const method = (request.method || 'GET').toUpperCase() as ApiRequest['method']
    const url = typeof request.url === 'string' ? request.url : request.url?.raw || ''
    const headers: KeyValue[] = (request.header || []).map(h => ({
      key: h.key || '',
      value: h.value || '',
      enabled: !h.disabled,
    }))
    let bodyType: ApiRequest['bodyType'] = 'none'
    let bodyRaw = ''
    let bodyJson = ''
    const bodyMode = request.body?.mode
    const bodyContent = request.body?.raw || ''
    if (bodyMode === 'raw') {
      try { JSON.parse(bodyContent); bodyJson = bodyContent; bodyType = 'json' }
      catch { bodyRaw = bodyContent; bodyType = 'raw' }
    } else if (bodyMode === 'urlencoded') {
      bodyRaw = bodyContent; bodyType = 'raw'
    }
    return { ...defaultRequest, method, url, headers, bodyType, bodyJson, bodyRaw }
  })
}