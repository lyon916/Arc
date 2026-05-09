import { useRequestStore, useUiStore } from '../../store'
import type { AuthType } from '../../types/api'
import { t } from '../../i18n'

const authTypes: { value: AuthType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'bearer', label: 'Bearer' },
  { value: 'basic', label: 'Basic' },
]

export default function AuthEditor() {
  const { request, setAuthType, setAuthToken, setAuthUser, setAuthPass } = useRequestStore()
  const { authType, authToken, authUser, authPass } = request
  const lang = useUiStore((s) => s.lang)
  const tr = (key: string) => t[lang]?.[key] ?? key

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
            placeholder="Token"
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
            placeholder="Username"
            value={authUser}
            onChange={(e) => setAuthUser(e.target.value)}
          />
          <input
            className="input-linear w-full"
            type="password"
            placeholder="Password"
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