import { useMemo } from 'react'
import { useRequestStore, useUiStore } from '../../store'
import type { AuthType } from '../../types/api'
import { t } from '../../i18n'

export default function AuthEditor() {
  const { request, setAuthType, setAuthToken, setAuthUser, setAuthPass } = useRequestStore()
  const { authType, authToken, authUser, authPass } = request
  const lang = useUiStore((s) => s.lang)
  const tr = (key: string) => t[lang]?.[key] ?? key

  const authTypes = useMemo(() => [
    { value: 'none' as AuthType, label: tr('noneLabel') },
    { value: 'bearer' as AuthType, label: tr('bearerLabel') },
    { value: 'basic' as AuthType, label: tr('basicLabel') },
  ], [tr])

  return (
    <div className="flex flex-col gap-3 animate-fade-in">
      {/* Auth type selector */}
      <div className="flex gap-0">
        {authTypes.map((t) => (
          <button
            key={t.value}
            className={`tab-linear ${authType === t.value ? 'tab-active' : ''}`}
            onClick={() => setAuthType(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Bearer */}
      {authType === 'bearer' && (
        <div className="animate-fade-in">
          <input
            className="input-linear w-full"
            type="password"
            placeholder={tr('authToken')}
            value={authToken}
            onChange={(e) => setAuthToken(e.target.value)}
          />
        </div>
      )}

      {/* Basic */}
      {authType === 'basic' && (
        <div className="flex flex-col gap-2 animate-fade-in">
          <input
            className="input-linear w-full"
            placeholder={tr('authUsername')}
            value={authUser}
            onChange={(e) => setAuthUser(e.target.value)}
          />
          <input
            className="input-linear w-full"
            type="password"
            placeholder={tr('authPassword')}
            value={authPass}
            onChange={(e) => setAuthPass(e.target.value)}
          />
        </div>
      )}

      {/* None */}
      {authType === 'none' && (
        <p
          className="text-center py-6 animate-fade-in"
          style={{ color: 'var(--text-tertiary)', fontSize: 13 }}
        >
          {tr('noAuth')}
        </p>
      )}
    </div>
  )
}