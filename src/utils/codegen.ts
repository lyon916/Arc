import type { ApiRequest } from '../types/api'
import { enabledItems } from './shared'
import { buildAuthHeader } from './authHeaders'

function buildUrl(req: ApiRequest): string {
  const params = enabledItems(req.queryParams)
  if (!req.url) return ''
  if (params.length === 0) return req.url
  try {
    const url = new URL(req.url)
    for (const p of params) url.searchParams.append(p.key, p.value)
    return url.toString()
  } catch {
    return req.url
  }
}

function buildHeaders(req: ApiRequest): Record<string, string> {
  const headers: Record<string, string> = {}
  for (const h of enabledItems(req.headers)) headers[h.key] = h.value
  const authHeader = buildAuthHeader(req.authType, req.authToken, req.authUser, req.authPass)
  if (authHeader) headers[authHeader.key] = authHeader.value
  if (req.bodyType === 'json' && req.bodyJson && !headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json'
  }
  return headers
}

function hasBody(req: ApiRequest): boolean {
  return req.method !== 'GET' && req.method !== 'HEAD' && req.bodyType !== 'none'
}

export function toCurl(req: ApiRequest): string {
  const url = buildUrl(req)
  const headers = buildHeaders(req)
  const parts = [`curl -X ${req.method}`]
  for (const [k, v] of Object.entries(headers)) parts.push(`-H '${k}: ${v}'`)

  if (hasBody(req)) {
    if (req.bodyType === 'json' && req.bodyJson) {
      parts.push(`-d '${req.bodyJson}'`)
    } else if (req.bodyType === 'formdata') {
      for (const item of enabledItems(req.bodyFormData)) {
        parts.push(`-F '${item.key}=${item.value}'`)
      }
    } else if (req.bodyType === 'raw' && req.bodyRaw) {
      parts.push(`-d '${req.bodyRaw}'`)
    }
  }
  parts.push(`'${url}'`)
  return parts.join(' \\\n  ')
}

export function toPython(req: ApiRequest): string {
  const url = buildUrl(req)
  const headers = buildHeaders(req)
  let code = `import requests\n\n`
  if (hasBody(req) && req.bodyType === 'formdata') {
    const dataObj: Record<string, string> = {}
    for (const item of enabledItems(req.bodyFormData)) dataObj[item.key] = item.value
    code += `data = ${JSON.stringify(dataObj, null, 2)}\n\n`
    code += `response = requests.${req.method.toLowerCase()}('${url}', data=data, headers=${JSON.stringify(headers, null, 2)})\n`
  } else if (hasBody(req) && req.bodyType === 'json' && req.bodyJson) {
    code += `response = requests.${req.method.toLowerCase()}('${url}', json=${req.bodyJson}, headers=${JSON.stringify(headers, null, 2)})\n`
  } else if (hasBody(req) && req.bodyType === 'raw' && req.bodyRaw) {
    code += `response = requests.${req.method.toLowerCase()}('${url}', data='${req.bodyRaw}', headers=${JSON.stringify(headers, null, 2)})\n`
  } else {
    code += `response = requests.${req.method.toLowerCase()}('${url}', headers=${JSON.stringify(headers, null, 2)})\n`
  }
  code += `print(response.status_code)\nprint(response.text)\n`
  return code
}

export function toFetch(req: ApiRequest): string {
  const url = buildUrl(req)
  const headers = buildHeaders(req)
  const opts: string[] = [`  method: '${req.method}'`]
  if (Object.keys(headers).length > 0) opts.push(`  headers: ${JSON.stringify(headers, null, 4).replace(/\n/g, '\n  ')}`)

  if (hasBody(req)) {
    if (req.bodyType === 'json' && req.bodyJson) {
      opts.push(`  body: JSON.stringify(${req.bodyJson})`)
    } else if (req.bodyType === 'formdata') {
      const fd: Record<string, string> = {}
      for (const item of enabledItems(req.bodyFormData)) fd[item.key] = item.value
      opts.push(`  body: new FormData(Object.entries(${JSON.stringify(fd)}).map(([k,v]) => [k,v]))`)
    } else if (req.bodyType === 'raw' && req.bodyRaw) {
      opts.push(`  body: '${req.bodyRaw}'`)
    }
  }
  return `fetch('${url}', {\n${opts.join(',\n')}\n})\n  .then(res => res.text())\n  .then(console.log)`
}

export function toGo(req: ApiRequest): string {
  const url = buildUrl(req)
  const headers = buildHeaders(req)
  let code = `package main\n\nimport (\n  "fmt"\n  "io"\n  "net/http"\n`
  const needBody = hasBody(req)
  if (needBody && req.bodyType === 'formdata') code += `  "mime/multipart"\n  "bytes"\n`
  else if (needBody) code += `  "strings"\n`
  code += `)\n\nfunc main() {\n`

  if (needBody && req.bodyType === 'formdata') {
    code += `  body := &bytes.Buffer{}\n  writer := multipart.NewWriter(body)\n`
    for (const item of enabledItems(req.bodyFormData)) {
      code += `  writer.WriteField("${item.key}", "${item.value}")\n`
    }
    code += `  writer.Close()\n`
    if (!headers['Content-Type'] && !headers['content-type']) {
      code += `  // Content-Type set automatically by multipart writer\n`
    }
    code += `  req, _ := http.NewRequest("${req.method}", "${url}", body)\n`
  } else if (needBody && req.bodyType === 'json' && req.bodyJson) {
    code += `  req, _ := http.NewRequest("${req.method}", "${url}", strings.NewReader(${JSON.stringify(req.bodyJson)}))\n`
  } else if (needBody && req.bodyType === 'raw' && req.bodyRaw) {
    code += `  req, _ := http.NewRequest("${req.method}", "${url}", strings.NewReader("${req.bodyRaw}"))\n`
  } else {
    code += `  req, _ := http.NewRequest("${req.method}", "${url}", nil)\n`
  }

  for (const [k, v] of Object.entries(headers)) {
    code += `  req.Header.Set("${k}", "${v}")\n`
  }
  code += `  client := &http.Client{}\n  res, _ := client.Do(req)\n  defer res.Body.Close()\n`
  code += `  bodyBytes, _ := io.ReadAll(res.Body)\n  fmt.Println(res.StatusCode)\n  fmt.Println(string(bodyBytes))\n}\n`
  return code
}