/**
 * Arc CORS Proxy — Cloudflare Worker
 *
 * Forwards requests through proxy.arcapi.xyz to bypass browser CORS restrictions.
 * Target URL is passed as ?url=<encoded_url> query parameter.
 *
 * Deploy: cd worker && npx wrangler deploy
 */

// HTTP methods that should not include a body
const BODYLESS_METHODS = new Set(['GET', 'HEAD'])

// Headers stripped from the incoming request before forwarding
const STRIP_REQUEST_HEADERS = new Set([
  'host',
  'origin',
  'referer',
  'cf-connecting-ip',
  'cf-ipcountry',
  'cf-ray',
  'cf-visitor',
  'x-forwarded-for',
  'x-forwarded-proto',
  'x-real-ip',
])

// Headers stripped from the upstream response before returning
const STRIP_RESPONSE_HEADERS = new Set([
  'content-encoding',   // let CF handle re-compression
  'content-security-policy',
  'set-cookie',         // security: don't leak cookies
  'strict-transport-security',
  'x-frame-options',
])

function buildCorsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400',
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // === CORS Preflight ===
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: buildCorsHeaders(request.headers.get('Origin')),
      })
    }

    // === Health check ===
    if (url.pathname === '/health') {
      return new Response('ok', {
        headers: { 'Content-Type': 'text/plain', ...buildCorsHeaders('*') },
      })
    }

    // === Extract target URL ===
    let targetUrl = url.searchParams.get('url')
    if (!targetUrl) {
      return new Response('Missing ?url= parameter. Usage: proxy.arcapi.xyz/?url=https://api.example.com/data', {
        status: 400,
        headers: { 'Content-Type': 'text/plain', ...buildCorsHeaders('*') },
      })
    }

    // Decode if it was double-encoded
    try {
      targetUrl = decodeURIComponent(targetUrl)
    } catch {}
    try {
      // Validate URL
      new URL(targetUrl)
    } catch {
      return new Response(`Invalid target URL: ${targetUrl}`, {
        status: 400,
        headers: { 'Content-Type': 'text/plain', ...buildCorsHeaders('*') },
      })
    }

    // === Build forwarded request ===
    const headers = new Headers()
    for (const [key, value] of request.headers) {
      if (!STRIP_REQUEST_HEADERS.has(key.toLowerCase())) {
        headers.set(key, value)
      }
    }

    const fetchInit = {
      method: request.method,
      headers,
      redirect: 'follow',
      cf: {
        // Don't cache proxied responses
        cacheTtl: 0,
      },
    }

    // Attach body for methods that support it
    if (!BODYLESS_METHODS.has(request.method.toUpperCase())) {
      fetchInit.body = await request.arrayBuffer()
    }

    // === Forward request ===
    let response
    try {
      response = await fetch(targetUrl, fetchInit)
    } catch (err) {
      return new Response(`Proxy error: ${err.message}`, {
        status: 502,
        headers: { 'Content-Type': 'text/plain', ...buildCorsHeaders('*') },
      })
    }

    // === Build response ===
    const responseHeaders = new Headers()
    for (const [key, value] of response.headers) {
      if (!STRIP_RESPONSE_HEADERS.has(key.toLowerCase())) {
        responseHeaders.set(key, value)
      }
    }

    // Add CORS headers
    const corsHeaders = buildCorsHeaders(request.headers.get('Origin'))
    for (const [key, value] of Object.entries(corsHeaders)) {
      responseHeaders.set(key, value)
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  },
}
