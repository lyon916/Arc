import { useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '../store'
import {
  getSession, setSession, clearSession,
  getMe, logout as apiLogout,
  sendVerificationCode, verifyCode,
  getOAuthUrl,
} from '../utils/api'

/**
 * Auth hook — manages login session lifecycle.
 *
 * On mount: restores session token from localStorage, validates with server.
 * Provides: login (email code / OAuth), logout, session state.
 */

export function useAuth() {
  const { user, sessionToken } = useAuthStore()
  const initialized = useRef(false)
  const oauthWindow = useRef<Window | null>(null)

  // Init: restore session from localStorage and validate
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const token = getSession()
    if (!token) return
    useAuthStore.setState({ sessionToken: token })

    // Validate session in background
    getMe().then((u) => {
      if (u) useAuthStore.setState({ user: u })
      else clearSession()
    }).catch(() => {
      // Server unreachable — keep local session alive
    })
  }, [])

  // --- Email code flow ---

  const sendCode = useCallback(async (email: string): Promise<{ ok: boolean; message?: string }> => {
    return sendVerificationCode(email)
  }, [])

  const loginWithCode = useCallback(async (email: string, code: string): Promise<{ ok: boolean; message?: string }> => {
    const result = await verifyCode(email, code)
    if (result.ok && result.session && result.user) {
      setSession(result.session)
      useAuthStore.setState({ sessionToken: result.session, user: result.user })
    }
    return { ok: result.ok, message: result.message }
  }, [])

  // --- OAuth flow ---

  const startOAuth = useCallback((provider: 'github' | 'google') => {
    const url = getOAuthUrl(provider)
    const w = window.open(url, `arc-oauth-${provider}`, 'width=600,height=700')
    oauthWindow.current = w

    // Listen for callback message from popup
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== new URL(url).origin) return
      if (e.data?.type === 'arc-oauth' && e.data?.session && e.data?.user) {
        setSession(e.data.session)
        useAuthStore.setState({
          sessionToken: e.data.session,
          user: e.data.user,
          authModalOpen: false,
        })
        w?.close()
        window.removeEventListener('message', onMessage)
      }
    }
    window.addEventListener('message', onMessage)
  }, [])

  // --- Logout ---

  const handleLogout = useCallback(async () => {
    try { await apiLogout() } catch { /* server offline */ }
    clearSession()
    useAuthStore.getState().logout()
  }, [])

  return {
    user,
    sessionToken,
    isLoggedIn: !!user,
    sendCode,
    loginWithCode,
    startOAuth,
    logout: handleLogout,
  }
}
