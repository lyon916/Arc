import type { ApiRequest, KeyValue } from '../types/api'
import { defaultRequest } from './shared'
import type { WorkspaceTreeNode } from '../hooks/useWorkspace'
import type { WorkspaceItem } from '../db'

// ---- OpenAPI 3.0 type definitions ----

interface OpenApiSpec {
  openapi: string
  info: { title: string; version: string }
  servers?: { url: string; description?: string }[]
  paths: Record<string, Record<string, OpenApiOperation>>
  components?: {
    securitySchemes?: Record<string, OpenApiSecurityScheme>
  }
  tags?: { name: string; description?: string }[]
}

interface OpenApiOperation {
  summary?: string
  description?: string
  operationId?: string
  tags?: string[]
  parameters?: OpenApiParameter[]
  requestBody?: OpenApiRequestBody
  security?: Record<string, string[]>[]
  responses?: Record<string, unknown>
}

interface OpenApiParameter {
  name: string
  in: 'query' | 'header' | 'path' | 'cookie'
  description?: string
  required?: boolean
  schema?: { type: string; default?: string }
  example?: string
}

interface OpenApiRequestBody {
  description?: string
  required?: boolean
  content: Record<string, { schema?: unknown; example?: unknown }>
}

interface OpenApiSecurityScheme {
  type: 'http' | 'apiKey' | 'oauth2' | 'openIdConnect'
  scheme?: string
  bearerFormat?: string
}

// ---- Helpers ----

function parseBaseUrl(url: string): { base: string; path: string } {
  try {
    const u = new URL(url)
    const base = `${u.protocol}//${u.host}`
    return { base, path: u.pathname }
  } catch {
    const clean = url.split('?')[0]
    return { base: 'http://localhost', path: clean.startsWith('/') ? clean : '/' + clean }
  }
}

function buildUrl(base: string, path: string): string {
  const b = base.endsWith('/') ? base.slice(0, -1) : base
  const p = path.startsWith('/') ? path : '/' + path
  return b + p
}

function extractQueryFromPath(path: string): { cleanPath: string; queryParams: KeyValue[] } {
  const idx = path.indexOf('?')
  if (idx === -1) return { cleanPath: path, queryParams: [] }
  const search = path.slice(idx)
  const params: KeyValue[] = []
  try {
    const sp = new URLSearchParams(search)
    for (const [key, value] of sp) {
      params.push({ key, value, enabled: true })
    }
  } catch { /* ignore malformed */ }
  return { cleanPath: path.slice(0, idx), queryParams: params }
}

function enabledKv(list: KeyValue[]): KeyValue[] {
  return list.filter((i) => i.enabled && i.key)
}

function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}

// ---- Export ----

export function exportToOpenApi(tree: WorkspaceTreeNode[]): string {
  const servers = new Set<string>()
  const tags: { name: string; description?: string }[] = []
  const paths: Record<string, Record<string, OpenApiOperation>> = {}
  const securitySchemes: Record<string, OpenApiSecurityScheme> = {}

  function walk(nodes: WorkspaceTreeNode[], parentTags: string[] = []) {
    for (const node of nodes) {
      if (node.type === 'folder') {
        tags.push({ name: node.name })
        walk(node.children, [...parentTags, node.name])
      } else if (node.type === 'request' && node.request) {
        const req = node.request
        if (!req.url) continue

        const { base, path } = parseBaseUrl(req.url)
        servers.add(base)

        const method = req.method.toLowerCase()

        if (!paths[path]) paths[path] = {}

        // Parameters
        const parameters: OpenApiParameter[] = []
        for (const p of enabledKv(req.queryParams)) {
          parameters.push({ name: p.key, in: 'query', example: p.value })
        }
        for (const h of enabledKv(req.headers)) {
          if (h.key.toLowerCase() === 'content-type') continue
          parameters.push({ name: h.key, in: 'header', example: h.value })
        }

        // Request body
        let requestBody: OpenApiRequestBody | undefined
        if (req.bodyType === 'json' && req.bodyJson) {
          let parsed: unknown = req.bodyJson
          try { parsed = JSON.parse(req.bodyJson) } catch { /* raw string */ }
          requestBody = { content: { 'application/json': { example: parsed } } }
        } else if (req.bodyType === 'formdata') {
          const props: Record<string, string> = {}
          for (const f of enabledKv(req.bodyFormData)) props[f.key] = f.value
          requestBody = { content: { 'multipart/form-data': { example: props } } }
        } else if (req.bodyType === 'raw' && req.bodyRaw) {
          requestBody = { content: { 'text/plain': { example: req.bodyRaw } } }
        }

        // Security
        let security: Record<string, string[]>[] | undefined
        if (req.authType === 'bearer') {
          securitySchemes['bearerAuth'] = { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
          security = [{ bearerAuth: [] }]
        } else if (req.authType === 'basic') {
          securitySchemes['basicAuth'] = { type: 'http', scheme: 'basic' }
          security = [{ basicAuth: [] }]
        }

        const op: OpenApiOperation = {
          summary: node.name || undefined,
          tags: parentTags.length > 0 ? parentTags : undefined,
          ...(parameters.length > 0 ? { parameters } : {}),
          ...(requestBody ? { requestBody } : {}),
          ...(security ? { security } : {}),
          responses: { '200': { description: 'OK' } },
        }

        paths[path][method] = op
      }
    }
  }

  walk(tree)

  const spec: OpenApiSpec = {
    openapi: '3.0.3',
    info: { title: 'Arc Workspace Export', version: '1.0.0' },
    servers: unique([...servers]).map((url) => ({ url })),
    paths,
    tags: tags.length > 0 ? tags : undefined,
    components: Object.keys(securitySchemes).length > 0
      ? { securitySchemes }
      : undefined,
  }

  return JSON.stringify(spec, null, 2)
}

// ---- Import ----

export function parseOpenApi(json: string, defaultBaseUrl?: string, sourceUrl?: string): WorkspaceItem[] {
  let spec: OpenApiSpec
  try {
    spec = JSON.parse(json)
  } catch {
    throw new Error('Invalid JSON')
  }

  if (!spec.openapi) {
    throw new Error('Not a valid OpenAPI specification (missing "openapi" field)')
  }

  const baseUrl = spec.servers?.[0]?.url || defaultBaseUrl || 'http://localhost'
  const items: WorkspaceItem[] = []
  const folderMap = new Map<string, number>() // tag name → temp parentId
  const batchId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  let tempId = -1

  // Pre-create folders from tags
  if (spec.tags) {
    for (const tag of spec.tags) {
      const id = tempId--
      folderMap.set(tag.name, id)
      items.push({
        uid: `ws-import-${batchId}-${id}`,
        name: tag.name,
        type: 'folder',
        parentId: null,
        order: items.length,
        createdAt: Date.now(),
      })
    }
  }

  // Process paths
  for (const [rawPath, methods] of Object.entries(spec.paths || {})) {
    // Collect path-level parameters (shared across all operations on this path)
    const pathLevelParams: OpenApiParameter[] = (methods as any).parameters || []

    // Extract query params baked into the path itself (from bad specs / older exports)
    const { cleanPath, queryParams: pathQueryParams } = extractQueryFromPath(rawPath)

    for (const [method, op] of Object.entries(methods)) {
      if (['parameters', 'servers', 'summary', 'description'].includes(method)) continue
      const upperMethod = method.toUpperCase()
      if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(upperMethod)) continue

      const req: ApiRequest = { ...defaultRequest, headers: [] }
      req.method = upperMethod as ApiRequest['method']
      req.url = buildUrl(baseUrl, cleanPath)

      // Tags → folder grouping
      let parentId: number | null = null
      if (op.tags && op.tags.length > 0) {
        const tagName = op.tags[0]
        if (folderMap.has(tagName)) {
          parentId = folderMap.get(tagName)!
        } else {
          const id = tempId--
          folderMap.set(tagName, id)
          items.push({
            uid: `ws-import-${batchId}-${id}`,
            name: tagName,
            type: 'folder',
            parentId: null,
            order: items.length,
            createdAt: Date.now(),
          })
          parentId = id
        }
      }

      // Query params extracted from the path URL itself
      for (const qp of pathQueryParams) {
        if (!req.queryParams.some((r) => r.key === qp.key)) {
          req.queryParams.push(qp)
        }
      }

      // Parameters — merge path-level first, then operation-level (op overrides)
      const paramDescriptions: Record<string, string> = {}
      const allParams = [...pathLevelParams, ...(op.parameters || [])]
      for (const p of allParams) {
        const val = p.example !== undefined ? String(p.example) : (p.schema?.default !== undefined ? String(p.schema.default) : '')
        if (p.in === 'query') {
          // Override existing (path-level or URL-query) with operation-level value
          const existing = req.queryParams.find((qp) => qp.key === p.name)
          if (existing) {
            existing.value = val
            if (p.description) existing.description = p.description
          } else {
            req.queryParams.push({ key: p.name, value: val, enabled: true, description: p.description })
          }
        } else if (p.in === 'header') {
          const existing = req.headers.find((h) => h.key === p.name)
          if (existing) {
            existing.value = val
            if (p.description) existing.description = p.description
          } else {
            req.headers.push({ key: p.name, value: val, enabled: true, description: p.description })
          }
        }
        if (p.description) {
          paramDescriptions[p.name] = p.description
        }
      }

      // Request body
      if (op.requestBody?.content) {
        const content = op.requestBody.content
        if (content['application/json']) {
          req.bodyType = 'json'
          const ex = content['application/json'].example
          req.bodyJson = typeof ex === 'string' ? ex : JSON.stringify(ex, null, 2)
          if (!req.headers.some((h) => h.key.toLowerCase() === 'content-type')) {
            req.headers.unshift({ key: 'Content-Type', value: 'application/json', enabled: true })
          }
        } else if (content['multipart/form-data']) {
          req.bodyType = 'formdata'
          const ex = content['multipart/form-data'].example
          if (ex && typeof ex === 'object') {
            for (const [k, v] of Object.entries(ex as Record<string, string>)) {
              req.bodyFormData.push({ key: k, value: String(v), enabled: true })
            }
          }
        } else {
          // Pick first available content type
          const [ct, body] = Object.entries(content)[0] || []
          req.bodyType = 'raw'
          if (body?.example) {
            req.bodyRaw = typeof body.example === 'string' ? body.example : JSON.stringify(body.example)
          }
          if (ct && !req.headers.some((h) => h.key.toLowerCase() === 'content-type')) {
            req.headers.unshift({ key: 'Content-Type', value: ct, enabled: true })
          }
        }
      }

      // Security
      if (op.security) {
        for (const sec of op.security) {
          const schemeName = Object.keys(sec)[0]
          if (!schemeName) continue
          const scheme = spec.components?.securitySchemes?.[schemeName]
          if (!scheme) continue
          if (scheme.type === 'http' && scheme.scheme === 'bearer') {
            req.authType = 'bearer'
          } else if (scheme.type === 'http' && scheme.scheme === 'basic') {
            req.authType = 'basic'
          }
        }
      }

      items.push({
        uid: `ws-import-req-${batchId}-${items.length}`,
        name: (op.summary || op.operationId || `${method.toUpperCase()} ${cleanPath}`).slice(0, 100),
        type: 'request',
        parentId,
        order: items.length,
        request: req,
        createdAt: Date.now(),
        ...(sourceUrl || op.description ? {
          openapiMeta: {
            sourceUrl: sourceUrl || '',
            ...(op.description ? { description: op.description } : {}),
            ...(Object.keys(paramDescriptions).length > 0 ? { paramDescriptions } : {}),
          },
        } : {}),
      })
    }
  }

  return items
}
