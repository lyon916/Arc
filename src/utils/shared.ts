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
