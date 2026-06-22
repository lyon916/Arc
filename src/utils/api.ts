/**
 * Arc-Server API 调用封装
 *
 * 默认使用 Arc 官方托管后端，可通过 localStorage 'arc-api-base' 覆盖为自建后端。
 * 符合 Arc-Server API 契约的任何实现均可替换。
 */

const API_BASE = getApiBase()

function getApiBase(): string {
  try {
    const custom = localStorage.getItem('arc-api-base')
    if (custom) return custom.replace(/\/$/, '')
  } catch { /* ignore */ }
  return 'https://api.arcapi.xyz'
}

let sessionToken: string | null = null

export function getSession(): string | null {
  if (!sessionToken) {
    try { sessionToken = localStorage.getItem('arc-session') } catch { /* ignore */ }
  }
  return sessionToken
}

export function setSession(token: string | null): void {
  sessionToken = token
  try {
    if (token) localStorage.setItem('arc-session', token)
    else localStorage.removeItem('arc-session')
  } catch { /* ignore */ }
}

export function clearSession(): void {
  setSession(null)
}

// ---- Auth API (no session needed) ----

export async function apiAuth(path: string, body?: unknown): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

// ---- Auth API ----

export interface SendCodeResponse {
  ok: boolean
  message?: string
}

export async function sendVerificationCode(email: string): Promise<SendCodeResponse> {
  const res = await apiAuth('/api/auth/send-code', { email })
  return res.json()
}

export interface VerifyCodeResponse {
  ok: boolean
  session?: string
  user?: UserInfo
  message?: string
}

export async function verifyCode(email: string, code: string): Promise<VerifyCodeResponse> {
  const res = await apiAuth('/api/auth/verify-code', { email, code })
  return res.json()
}

export function getOAuthUrl(provider: 'github' | 'google'): string {
  return `${API_BASE}/api/auth/${provider}`
}

// ---- Authenticated API ----

async function apiGet(path: string): Promise<Response> {
  const token = getSession()
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return fetch(`${API_BASE}${path}`, { headers })
}

async function apiPost(path: string, body?: unknown): Promise<Response> {
  const token = getSession()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
}

// ---- User ----

export interface UserInfo {
  id: string
  email?: string
  nickname?: string
  avatar?: string
  plan?: string
}

export async function getMe(): Promise<UserInfo | null> {
  const res = await apiGet('/api/auth/me')
  if (!res.ok) return null
  const data = await res.json()
  return data.user ?? null
}

export async function logout(): Promise<void> {
  await apiPost('/api/auth/logout')
  clearSession()
}

// ---- Sync ----

export interface SyncChange {
  data_type: 'workspace' | 'history' | 'environment'
  item_key: string
  payload: string   // JSON
  updated_at: number
  deleted: boolean
}

export interface SyncPullResponse {
  changes: SyncChange[]
}

export async function syncPull(since: number, types?: string[]): Promise<SyncChange[]> {
  const params = new URLSearchParams()
  params.set('since', String(since))
  if (types?.length) params.set('types', types.join(','))
  const res = await apiGet(`/api/sync/pull?${params.toString()}`)
  if (!res.ok) throw new Error(`Sync pull failed: ${res.status}`)
  const data: SyncPullResponse = await res.json()
  return data.changes
}

export interface SyncPushResponse {
  ok: boolean
  conflicts?: number
}

export async function syncPush(changes: SyncChange[]): Promise<SyncPushResponse> {
  const res = await apiPost('/api/sync/push', { changes })
  return res.json()
}
