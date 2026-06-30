import type { ApiRequest, ApiResponse, KeyValue } from '../types/api'
import { buildAuthHeader } from './authHeaders'
import { replaceEnvVars } from './envVars'
import { normalizeUrl } from './shared'
import { saveHistory } from '../hooks/useHistory'
import { useRequestStore, useUiStore } from '../store'


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

  // Build headers (env global headers → request headers → auth)
  const headers: Record<string, string> = {}

  // 1. Env global headers (base layer)
  for (const h of activeEnv?.headers || []) {
    if (h.enabled && h.key) {
      headers[replaceEnvVars(h.key, vars)] = replaceEnvVars(h.value, vars)
    }
  }

  // 2. Request-specific headers (override env headers)
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

  // Route through CORS proxy if enabled (skip for LAN/localhost — proxy can't reach private IPs)
  const useProxy = useUiStore.getState().useProxy && !isPrivateUrl(url)
  const fetchUrl = useProxy ? `${useUiStore.getState().proxyUrl}/?url=${encodeURIComponent(url)}` : url

  const res = await fetch(fetchUrl, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : body,
    signal,
  })

  const duration = Math.round(performance.now() - start)
  const responseHeaders: Record<string, string> = {}
  res.headers.forEach((value, key) => {
    responseHeaders[key] = value
  })

  // SSE / long-lived streaming responses: read incrementally so the UI
  // can render progress as chunks arrive instead of waiting for the
  // connection to close.
  const contentType = (responseHeaders['content-type'] || '').toLowerCase()
  const isEventStream = contentType.includes('text/event-stream')
  const updateStreamingBody = useRequestStore.getState().setStreamingBody

  let responseBody: string
  if (isEventStream && res.body) {
    updateStreamingBody('')
    const decoder = new TextDecoder()
    let accumulated = ''
    try {
      const reader = res.body.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        accumulated += chunk
        updateStreamingBody(accumulated)
      }
      // Flush any remaining bytes (partial UTF-8 sequences)
      accumulated += decoder.decode()
      updateStreamingBody(accumulated)
    } finally {
      updateStreamingBody(null)
    }
    responseBody = accumulated
  } else {
    responseBody = await res.text()
  }

  const response: ApiResponse = {
    status: res.status,
    statusText: res.statusText,
    headers: responseHeaders,
    body: responseBody,
    size: new Blob([responseBody]).size,
    duration: isEventStream ? Math.round(performance.now() - start) : duration,
  }

  // Save to history
  await saveHistory({ request, response, createdAt: Date.now() })

  return response
}

/** Skip proxy for localhost, 127.*, 10.*, 172.16-31.*, 192.168.* — Cloudflare can't reach them */
function isPrivateUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname
    if (hostname === 'localhost' || hostname === '[::1]') return true
    // IPv4 private ranges
    if (/^127\./.test(hostname)) return true
    if (/^10\./.test(hostname)) return true
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return true
    if (/^192\.168\./.test(hostname)) return true
    // 169.254.x.x link-local
    if (/^169\.254\./.test(hostname)) return true
    return false
  } catch {
    return false
  }
}

function buildUrl(baseUrl: string, params: KeyValue[]): string {
  if (!baseUrl) return ''
  baseUrl = normalizeUrl(baseUrl)

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