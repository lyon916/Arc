import { useState, useRef, useEffect } from 'react'
import { X, Mail } from 'lucide-react'
import { useAuthStore, useUiStore } from '../../store'
import { useAuth } from '../../hooks/useAuth'
import { ModalTransition } from '../common/ModalTransition'
import { t } from '../../i18n'

export function AuthModal() {
  const open = useAuthStore((s) => s.authModalOpen)
  const setOpen = useAuthStore((s) => s.setAuthModalOpen)
  const lang = useUiStore((s) => s.lang)
  const showToast = useUiStore((s) => s.showToast)
  const tr = (key: string) => t[lang]?.[key] ?? key

  const { sendCode, loginWithCode, startOAuth } = useAuth()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)

  useEffect(() => { if (open) inputRef.current?.focus() }, [open, step])

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setInterval(() => setCountdown((c) => c - 1), 1000)
      return () => clearInterval(timerRef.current)
    }
  }, [countdown])

  const handleSendCode = async () => {
    if (!email.trim() || countdown > 0) return
    setError('')
    setLoading(true)
    const result = await sendCode(email.trim())
    setLoading(false)
    if (result.ok) {
      setStep('code')
      setCountdown(60)
      showToast(`${tr('codeSentTo')} ${email.trim()}`, 'success')
    } else {
      setError(result.message || tr('sendCodeFailed'))
      showToast(result.message || tr('sendCodeFailed'), 'error')
    }
  }

  const handleVerify = async () => {
    if (!code.trim()) return
    setError('')
    setLoading(true)
    const result = await loginWithCode(email.trim(), code.trim())
    setLoading(false)
    if (result.ok) {
      setOpen(false)
      reset()
      showToast(tr('loginSuccess'), 'success')
    } else {
      setError(result.message || tr('verifyCodeFailed'))
      showToast(result.message || tr('verifyCodeFailed'), 'error')
    }
  }

  const reset = () => {
    setStep('email')
    setEmail('')
    setCode('')
    setError('')
    setCountdown(0)
  }

  const handleClose = () => {
    reset()
    setOpen(false)
  }

  return (
    <ModalTransition open={open} onClose={handleClose}>
      <div style={{ width: '380px', maxWidth: '90vw', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ fontWeight: 590, fontSize: '15px', fontFeatureSettings: '"cv01", "ss03"' }}>{tr('login')}</span>
          <button className="btn btn-sm btn-ghost" onClick={handleClose} style={{ padding: '4px 8px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>
          {step === 'email' ? (
            <>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 510, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                {tr('emailAddress')}
              </label>
              <input
                ref={inputRef}
                type="email"
                className="input-linear"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendCode() }}
                placeholder="you@example.com"
                style={{ width: '100%', marginBottom: '12px' }}
              />
              <button
                className="btn-brand"
                disabled={!email.trim() || loading || countdown > 0}
                onClick={handleSendCode}
                style={{ width: '100%', marginBottom: '16px' }}
              >
                {loading ? (
                  <svg width="16" height="16" viewBox="0 0 20 20" className="animate-spin" style={{ display: 'inline' }}>
                    <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="24 10" strokeLinecap="round" />
                  </svg>
                ) : countdown > 0 ? (
                  `${tr('resendIn')} ${countdown}s`
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Mail size={14} />
                    {tr('sendCode')}
                  </span>
                )}
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{tr('or')}</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
              </div>

              <button
                className="btn-ghost-linear"
                onClick={() => startOAuth('google')}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {tr('loginWithGoogle')}
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                {tr('codeSentTo')} <strong>{email}</strong>
              </p>
              <input
                ref={inputRef}
                type="text"
                className="input-linear"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleVerify() }}
                placeholder="123456"
                maxLength={6}
                style={{ width: '100%', marginBottom: '12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '18px', letterSpacing: '8px' }}
              />
              <button
                className="btn-brand"
                disabled={code.length < 6 || loading}
                onClick={handleVerify}
                style={{ width: '100%', marginBottom: '8px' }}
              >
                {loading ? (
                  <svg width="16" height="16" viewBox="0 0 20 20" className="animate-spin" style={{ display: 'inline' }}>
                    <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="24 10" strokeLinecap="round" />
                  </svg>
                ) : tr('verify')}
              </button>
              <button
                className="btn-ghost-linear"
                onClick={() => { setStep('email'); setError('') }}
                style={{ width: '100%', fontSize: '12px' }}
              >
                {tr('back')}
              </button>
            </>
          )}

          {error && (
            <div style={{ marginTop: '12px', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--status-error-bg)', color: 'var(--status-error)', fontSize: '12px' }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </ModalTransition>
  )
}
