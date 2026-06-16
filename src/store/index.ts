import { create } from 'zustand'
import type { ApiRequest, ApiResponse, HttpMethod, BodyType, KeyValue, AuthType } from '../types/api'
import { defaultRequest } from '../utils/shared'
import type { Lang } from '../i18n'

const defaultHeaders: KeyValue[] = [
  { key: 'Content-Type', value: 'application/json', enabled: true },
]

// 响应缓存：切换 API 后再切回来时保留响应内容
function cacheKey(req: ApiRequest): string {
  return `${req.method} ${req.url}`
}
const responseCache = new Map<string, { response: ApiResponse | null; streamingBody: string | null; timestamp: number | null }>()

interface RequestState {
  request: ApiRequest
  response: ApiResponse | null
  loading: boolean
  error: string | null
  streamingBody: string | null
  responseTimestamp: number | null
  setMethod: (method: HttpMethod) => void
  setUrl: (url: string) => void
  setHeaders: (headers: KeyValue[]) => void
  setBodyType: (type: BodyType) => void
  setBodyJson: (json: string) => void
  setBodyFormData: (data: KeyValue[]) => void
  setBodyRaw: (raw: string) => void
  setQueryParams: (params: KeyValue[]) => void
  setAuthType: (type: AuthType) => void
  setAuthToken: (token: string) => void
  setAuthUser: (user: string) => void
  setAuthPass: (pass: string) => void
  loadRequest: (req: ApiRequest) => void
  resetRequest: () => void
  setResponse: (response: ApiResponse | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setStreamingBody: (body: string | null) => void
}

export const useRequestStore = create<RequestState>((set) => ({
  request: { ...defaultRequest, headers: defaultHeaders },
  response: null,
  loading: false,
  error: null,
  streamingBody: null,
  responseTimestamp: null,
  setMethod: (method) => set((s) => ({ request: { ...s.request, method } })),
  setUrl: (url) => set((s) => ({ request: { ...s.request, url } })),
  setHeaders: (headers) => set((s) => ({ request: { ...s.request, headers } })),
  setBodyType: (type) => set((s) => ({ request: { ...s.request, bodyType: type } })),
  setBodyJson: (json) => set((s) => ({ request: { ...s.request, bodyJson: json } })),
  setBodyFormData: (data) => set((s) => ({ request: { ...s.request, bodyFormData: data } })),
  setBodyRaw: (raw) => set((s) => ({ request: { ...s.request, bodyRaw: raw } })),
  setQueryParams: (params) => set((s) => ({ request: { ...s.request, queryParams: params } })),
  setAuthType: (type) => set((s) => ({ request: { ...s.request, authType: type } })),
  setAuthToken: (token) => set((s) => ({ request: { ...s.request, authToken: token } })),
  setAuthUser: (user) => set((s) => ({ request: { ...s.request, authUser: user } })),
  setAuthPass: (pass) => set((s) => ({ request: { ...s.request, authPass: pass } })),
  loadRequest: (req) => {
    const key = cacheKey(req)
    const cached = responseCache.get(key)
    set({ request: req, response: cached?.response ?? null, streamingBody: cached?.streamingBody ?? null, responseTimestamp: cached?.timestamp ?? null, error: null })
  },
  resetRequest: () => set({
    request: { ...defaultRequest, headers: defaultHeaders },
    response: null,
    error: null,
    responseTimestamp: null,
  }),
  setResponse: (response) => {
    const req = useRequestStore.getState().request
    const now = Date.now()
    if (response) {
      responseCache.set(cacheKey(req), { response, streamingBody: null, timestamp: now })
    }
    set({ response, responseTimestamp: now })
  },
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setStreamingBody: (body) => {
    const req = useRequestStore.getState().request
    if (body !== null) {
      const existing = responseCache.get(cacheKey(req))
      responseCache.set(cacheKey(req), { response: existing?.response ?? null, streamingBody: body, timestamp: existing?.timestamp ?? null })
    }
    set({ streamingBody: body })
  },
}))

type ToastType = 'success' | 'error' | 'info'

export type { ToastType }

interface ToastAction {
  label: string
  onClick: () => void
}

interface ToastState {
  message: string
  type: ToastType
  action?: ToastAction
  duration?: number
}

export type ThemeName = 'light' | 'linear-dark' | 'midnight' | 'dracula' | 'dracula-light' | 'nord' | 'solarized' | 'tokyo-night' | 'catppuccin' | 'catppuccin-latte' | 'gruvbox' | 'one-dark' | 'rose-pine-dawn' | 'github-light' | 'nord-light' | 'frost-light' | 'zen'

export const THEME_LIST: { name: ThemeName; label: string; icon: string; preview: string }[] = [
  { name: 'light', label: 'Light', icon: '☀️', preview: '#f7f8f8' },
  { name: 'github-light', label: 'GitHub Light', icon: '🐙', preview: '#ffffff' },
  { name: 'frost-light', label: 'Frost Light', icon: '❄️', preview: '#f2f4f8' },
  { name: 'nord-light', label: 'Nord Light', icon: '🧊', preview: '#eceff4' },
  { name: 'rose-pine-dawn', label: 'Rose Pine Dawn', icon: '🌹', preview: '#faf4ed' },
  { name: 'dracula-light', label: 'Dracula Light', icon: '🧛', preview: '#f8f8f2' },
  { name: 'catppuccin-latte', label: 'Catppuccin Latte', icon: '🎀', preview: '#eff1f5' },
  { name: 'zen', label: 'Zen', icon: '🍃', preview: '#f9faf8' },
  { name: 'linear-dark', label: 'Linear Dark', icon: '🔵', preview: '#08090a' },
  { name: 'midnight', label: 'Midnight', icon: '🌌', preview: '#0d1117' },
  { name: 'dracula', label: 'Dracula', icon: '🦇', preview: '#282a36' },
  { name: 'nord', label: 'Nord', icon: '🌑', preview: '#2e3440' },
  { name: 'solarized', label: 'Solarized', icon: '🌅', preview: '#002b36' },
  { name: 'tokyo-night', label: 'Tokyo Night', icon: '🌃', preview: '#1a1b26' },
  { name: 'catppuccin', label: 'Catppuccin', icon: '🌸', preview: '#1e1e2e' },
  { name: 'gruvbox', label: 'Gruvbox', icon: '🍂', preview: '#282828' },
  { name: 'one-dark', label: 'One Dark', icon: '💎', preview: '#282c34' },
]

const savedTheme = (localStorage.getItem('arc-theme') || localStorage.getItem('lightio-theme') || localStorage.getItem('spacelabs-theme')) as ThemeName || null
const fallbackTheme: ThemeName = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'linear-dark'
const theme = savedTheme || fallbackTheme

const savedSidebarTab = (localStorage.getItem('arc-sidebar-tab') || localStorage.getItem('lightio-sidebar-tab') || localStorage.getItem('spacelabs-sidebar-tab')) as 'history' | 'workspace' | null
const initialSidebarTab = savedSidebarTab || 'workspace'

const savedSidebarWidth = parseInt(localStorage.getItem('arc-sidebar-width') || localStorage.getItem('lightio-sidebar-width') || localStorage.getItem('spacelabs-sidebar-width') || '270', 10)
const savedAutoSave = (localStorage.getItem('arc-autosave') || localStorage.getItem('lightio-autosave') || localStorage.getItem('spacelabs-autosave')) !== 'false'
const savedLang = (localStorage.getItem('arc-lang') || localStorage.getItem('lightio-lang') || localStorage.getItem('spacelabs-lang')) as Lang | null
const initialLang: Lang = savedLang || (navigator.language.startsWith('zh') ? 'zh' : 'en')
const savedUseProxy = localStorage.getItem('arc-use-proxy')
const initialUseProxy = savedUseProxy === 'true'
document.documentElement.setAttribute('data-theme', theme)

let sidebarSaveTimer: ReturnType<typeof setTimeout> | null = null

interface UiState {
  sidebarOpen: boolean
  sidebarWidth: number
  splitRatio: number
  theme: ThemeName
  sidebarTab: 'history' | 'workspace'
  autoSave: boolean
  lang: Lang
  useProxy: boolean
  historyVersion: number
  workspaceVersion: number
  setSidebarOpen: (open: boolean) => void
  setSidebarWidth: (width: number) => void
  setSplitRatio: (ratio: number) => void
  setTheme: (theme: ThemeName) => void
  setSidebarTab: (tab: 'history' | 'workspace') => void
  setAutoSave: (on: boolean) => void
  setLang: (lang: Lang) => void
  setUseProxy: (on: boolean) => void
  toast: ToastState | null
  bumpHistory: () => void
  bumpWorkspace: () => void
  showToast: (message: string, type?: ToastType, action?: ToastAction, duration?: number) => void
  clearToast: () => void
}

export const useUiStore = create<UiState>((set, get) => ({
  sidebarOpen: true,
  sidebarWidth: savedSidebarWidth,
  splitRatio: 0.4,
  theme: theme,
  sidebarTab: initialSidebarTab,
  autoSave: savedAutoSave,
  lang: initialLang,
  useProxy: initialUseProxy,
  historyVersion: 0,
  workspaceVersion: 0,
  toast: null,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarWidth: (width) => {
    set({ sidebarWidth: width })
    if (sidebarSaveTimer) clearTimeout(sidebarSaveTimer)
    sidebarSaveTimer = setTimeout(() => {
      localStorage.setItem('arc-sidebar-width', String(get().sidebarWidth))
    }, 200)
  },
  setSplitRatio: (ratio) => set({ splitRatio: ratio }),
  setTheme: (theme) => {
    document.documentElement.classList.add('notransition')
    set({ theme })
    localStorage.setItem('arc-theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('notransition')
    })
  },
  setSidebarTab: (tab) => {
    localStorage.setItem('arc-sidebar-tab', tab)
    set({ sidebarTab: tab })
  },
  setAutoSave: (on) => {
    localStorage.setItem('arc-autosave', String(on))
    set({ autoSave: on })
  },
  setLang: (lang) => {
    localStorage.setItem('arc-lang', lang)
    set({ lang })
  },
  setUseProxy: (on) => {
    localStorage.setItem('arc-use-proxy', String(on))
    set({ useProxy: on })
  },
  bumpHistory: () => set((s) => ({ historyVersion: s.historyVersion + 1 })),
  bumpWorkspace: () => set((s) => ({ workspaceVersion: s.workspaceVersion + 1 })),
  showToast: (message, type = 'info', action, duration) => set({ toast: { message, type, action, duration } }),
  clearToast: () => set({ toast: null }),
}))