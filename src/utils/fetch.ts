import type { ApiRequest, ApiResponse, KeyValue } from '../types/api'
import { buildAuthHeader } from './authHeaders'
import { replaceEnvVars } from './envVars'
import { saveHistory } from '../hooks/useHistory'
import { useUiStore } from '../store'

const PROXY_URL = 'https://proxy.arcapi.xyz'

export async function sendRequest(request: ApiRequest, signal?: AbortSignal): Promise<ApiResponse> {
  // Env var replacement
  const { getActiveEnv } = await import('../hooks/useEnvironment')
  const activeEnv = await getActiveEnv()
  const vars = activeEnv?.variables || []

  const url = buildUrl(replaceEnvVars(request.url, vars), request.queryParams.map(p => ({
    ...p,
    key: replaceEnvVars(p.key, vars),
    value: replaceEnvVars(p.value, vars),
  })))

  // Build headers (filter disabled + env replace + auth)
  const headers: Record<string, string> = {}
  for (const h of request.headers) {
    if (h.enabled && h.key) {
      headers[replaceEnvVars(h.key, vars)] = replaceEnvVars(h.value, vars)
    }
  }

  // Auth header
  const authHeader = buildAuthHeader(request.authType, request.authToken, request.authUser, request.authPass)
  if (authHeader) {
    headers[authHeader.key] = authHeader.value
  }

  // Build body
  let body: string | FormData | undefined
  if (request.bodyType === 'json' && request.bodyJson) {
    body = replaceEnvVars(request.bodyJson, vars)
    if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json'
    }
  } else if (request.bodyType === 'formdata') {
    const fd = new FormData()
    for (const item of request.bodyFormData) {
      if (item.enabled && item.key) {
        fd.append(replaceEnvVars(item.key, vars), replaceEnvVars(item.value, vars))
      }
    }
    body = fd
  } else if (request.bodyType === 'raw' && request.bodyRaw) {
    body = replaceEnvVars(request.bodyRaw, vars)
  }

  const start = performance.now()

  // Route through CORS proxy if enabled
  const useProxy = useUiStore.getState().useProxy
  const fetchUrl = useProxy ? `${PROXY_URL}/?url=${encodeURIComponent(url)}` : url

  const res = await fetch(fetchUrl, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : body,
    signal,
  })

  const duration = Math.round(performance.now() - start)
  const responseBody = await res.text()

  const responseHeaders: Record<string, string> = {}
  res.headers.forEach((value, key) => {
    responseHeaders[key] = value
  })

  const response: ApiResponse = {
    status: res.status,
    statusText: res.statusText,
    headers: responseHeaders,
    body: responseBody,
    size: new Blob([responseBody]).size,
    duration,
  }

  // Save to history
  await saveHistory({ request, response, createdAt: Date.now() })

  return response
}

function buildUrl(baseUrl: string, params: KeyValue[]): string {
  if (!baseUrl) return ''

  const enabledParams = params.filter((p) => p.enabled && p.key)
  if (enabledParams.length === 0) return baseUrl

  try {
    const url = new URL(baseUrl)
    for (const p of enabledParams) {
      url.searchParams.append(p.key, p.value)
    }
    return url.toString()
  } catch {
    return baseUrl
  }
}