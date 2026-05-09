import type { ApiRequest, KeyValue } from '../types/api'
import { defaultRequest } from './shared'

export function parseUrl(urlStr: string): ApiRequest {
  try {
    const url = new URL(urlStr)
    const queryParams: KeyValue[] = []
    url.searchParams.forEach((value, key) => {
      queryParams.push({ key, value, enabled: true })
    })
    const baseUrl = url.origin + url.pathname
    return {
      ...defaultRequest,
      method: 'GET',
      url: baseUrl,
      queryParams,
    }
  } catch {
    return { ...defaultRequest, method: 'GET', url: urlStr }
  }
}