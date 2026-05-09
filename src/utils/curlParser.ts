import type { ApiRequest, KeyValue } from '../types/api'
import { defaultRequest } from './shared'

function extractQuotedValue(s: string): { value: string; rest: string } | null {
  const q = s[0]
  if (q !== '"' && q !== "'") return null
  let i = 1, v = ''
  while (i < s.length) {
    if (s[i] === '\\' && i + 1 < s.length) { v += s[i + 1]; i += 2 }
    else if (s[i] === q) return { value: v, rest: s.slice(i + 1).trim() }
    else { v += s[i]; i++ }
  }
  return null
}

function extractBareValue(s: string): { value: string; rest: string } {
  const m = s.match(/^(\S+)(.*)/)
  return m ? { value: m[1], rest: m[2].trim() } : { value: '', rest: '' }
}

function extractValue(s: string): { value: string; rest: string } {
  const q = extractQuotedValue(s)
  return q || extractBareValue(s)
}

export function parseCurl(curl: string): ApiRequest {
  // Normalize: remove line continuations
  const cmd = curl.replace(/\\\n/g, ' ').replace(/\s+/g, ' ').trim()
  let method: ApiRequest['method'] = 'GET'
  let url = ''
  const headers: KeyValue[] = []
  let data = ''
  let hasData = false

  // Strip leading "curl"
  let rest = cmd.replace(/^curl\s+/, '')

  while (rest) {
    // --request / -X
    const mMethod = rest.match(/^(-X|--request)\s+/)
    if (mMethod) {
      rest = rest.slice(mMethod[0].length)
      const v = extractValue(rest)
      method = v.value.toUpperCase() as ApiRequest['method']
      rest = v.rest
      continue
    }
    // --header / -H
    const mHeader = rest.match(/^(-H|--header)\s+/)
    if (mHeader) {
      rest = rest.slice(mHeader[0].length)
      const v = extractValue(rest)
      const idx = v.value.indexOf(':')
      if (idx > -1) {
        headers.push({ key: v.value.slice(0, idx).trim(), value: v.value.slice(idx + 1).trim(), enabled: true })
      }
      rest = v.rest
      continue
    }
    // --data / --data-raw / -d
    const mData = rest.match(/^(-d|--data|--data-raw)\s+/)
    if (mData) {
      rest = rest.slice(mData[0].length)
      const v = extractValue(rest)
      data = v.value
      hasData = true
      rest = v.rest
      continue
    }
    // Other flags like --compressed, -k, -s, -L etc — skip
    const mFlag = rest.match(/^--?[a-zA-Z](?:[a-zA-Z-]*)(?:\s+\S+)?/)
    if (mFlag && !rest.match(/^(-X|--request|-H|--header|-d|--data|--data-raw)\s+/)) {
      // Could be a flag with value or just a flag
      const flagMatch = rest.match(/^--?[a-zA-Z-]+(?:=\S+|\s+(?:(?:"[^"]*"|'[^']*'|\S+)))?/)
      if (flagMatch) { rest = rest.slice(flagMatch[0].length).trim(); continue }
    }
    // URL (bare or quoted)
    if (!url) {
      const v = extractValue(rest)
      url = v.value
      rest = v.rest
      continue
    }
    // Skip unknown token
    const v = extractValue(rest)
    rest = v.rest
  }

  if (hasData && method === 'GET') method = 'POST'

  let bodyType: ApiRequest['bodyType'] = 'none'
  let bodyJson = ''
  let bodyRaw = ''
  if (hasData) {
    try { JSON.parse(data); bodyJson = data; bodyType = 'json' }
    catch { bodyRaw = data; bodyType = 'raw' }
  }

  return { ...defaultRequest, method, url, headers, bodyType, bodyJson, bodyRaw }
}