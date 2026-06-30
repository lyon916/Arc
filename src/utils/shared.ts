import type { ApiRequest, HttpMethod, KeyValue } from '../types/api'

export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

export const methodLower: Record<string, string> = {
  GET: 'get',
  POST: 'post',
  PUT: 'put',
  DELETE: 'delete',
  PATCH: 'patch',
  HEAD: 'head',
  OPTIONS: 'options',
}

export function statusClass(status: number): string {
  if (status === 0) return 'status-err'
  if (status >= 200 && status < 300) return 'status-2xx'
  if (status >= 300 && status < 400) return 'status-3xx'
  if (status >= 400 && status < 500) return 'status-4xx'
  if (status >= 500) return 'status-5xx'
  return ''
}

/** 修复 URL 中多余的连续斜杠（保留协议中的 ://） */
export function normalizeUrl(raw: string): string {
  if (!raw) return ''
  const match = raw.match(/^(https?:\/\/)(.*)$/i)
  if (!match) {
    // No protocol — just collapse multiple slashes everywhere
    return raw.replace(/\/{2,}/g, '/')
  }
  return match[1] + match[2].replace(/\/{2,}/g, '/')
}

/** 从 URL 字符串中提取干净的路径显示（去掉协议、主机、前导斜杠） */
export function cleanUrlDisplay(raw: string): string {
  if (!raw) return ''
  let cleaned = raw.replace(/^https?:\/\//, '').replace(/^\/+/, '')
  const slash = cleaned.indexOf('/')
  const firstSegment = slash === -1 ? cleaned : cleaned.substring(0, slash)
  if (firstSegment.includes('.') || firstSegment.includes(':')) {
    return slash === -1 ? cleaned : cleaned.substring(slash + 1).replace(/^\/+/, '')
  }
  return cleaned
}

export function enabledItems(items: KeyValue[]): KeyValue[] {
  return items.filter((i) => i.enabled && i.key)
}

export const defaultRequest: ApiRequest = {
  method: 'GET',
  url: '',
  headers: [],
  bodyType: 'none',
  bodyJson: '',
  bodyFormData: [],
  bodyRaw: '',
  queryParams: [],
  authType: 'none',
  authToken: '',
  authUser: '',
  authPass: '',
}
