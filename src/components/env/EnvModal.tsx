import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { EnvRecord } from '../../db'
import type { KeyValue } from '../../types/api'
import { addEnv, updateEnv, deleteEnv, getAllEnvs, activateEnv } from '../../hooks/useEnvironment'
import { ModalTransition } from '../common/ModalTransition'
import { useUiStore } from '../../store'
import { t } from '../../i18n'

const emptyKV: KeyValue = { key: '', value: '', enabled: true }

export default function EnvModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [envs, setEnvs] = useState<EnvRecord[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [vars, setVars] = useState<KeyValue[]>([])
  const [envName, setEnvName] = useState('')
  const lang = useUiStore((s) => s.lang)
  const tr = (key: string) => t[lang]?.[key] ?? key

  const load = async () => {
    const all = await getAllEnvs()
    setEnvs(all)
    if (!selectedId && all.length > 0) setSelectedId(all[0].id!)
    if (selectedId) {
      const cur = all.find((e) => e.id === selectedId)
      if (cur) { setVars([...cur.variables]); setEnvName(cur.name) }
      else if (all.length > 0) { setSelectedId(all[0].id!); setVars([...all[0].variables]); setEnvName(all[0].name) }
    }
  }

  useEffect(() => { if (open) load() }, [open])

  const selectEnv = (id: number) => {
    setSelectedId(id)
    const env = envs.find((e) => e.id === id)
    if (env) { setVars([...env.variables]); setEnvName(env.name) }
  }

  const createEnv = async () => {
    const id = await addEnv('New Environment', [])
    await load()
    selectEnv(id)
  }

  const removeEnv = async () => {
    if (!selectedId) return
    await deleteEnv(selectedId)
    setSelectedId(null)
    setVars([])
    setEnvName('')
    await load()
  }

  const switchEnv = async () => {
    if (!selectedId) return
    await activateEnv(selectedId)
    await load()
  }

  const saveEnv = async () => {
    if (!selectedId) return
    await updateEnv(selectedId, { name: envName, variables: vars.filter((v) => v.key) })
    await load()
  }

  const addVar = () => setVars([...vars, { ...emptyKV }])
  const updateVar = (i: number, field: keyof KeyValue, val: string | boolean) => {
    const next = [...vars]
    ;(next[i] as any)[field] = val
    setVars(next)
  }
  const removeVar = (i: number) => setVars(vars.filter((_, j) => j !== i))

  const selected = envs.find((e) => e.id === selectedId)

  return (
    <ModalTransition open={open} onClose={onClose}>
      <div style={{ width: '720px', maxWidth: '90vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ fontWeight: 590, fontSize: '15px', fontFeatureSettings: '"cv01", "ss03"' }}>{tr('envManagement')}</span>
          <button className="btn btn-sm btn-ghost" onClick={onClose} style={{ padding: '4px 8px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', gap: '0', minHeight: '300px', flex: 1 }}>
          {/* Left: env list */}
          <div style={{ width: '220px', borderRight: '1px solid var(--border-subtle)', padding: '12px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 510, color: 'var(--text-tertiary)', fontFeatureSettings: '"cv01", "ss03"' }}>{tr('envList')}</span>
              <button className="btn-ghost-linear" onClick={createEnv} style={{ padding: '2px 8px', fontSize: '11px' }}>{tr('addEnv')}</button>
            </div>
            <ul style={{ flex: 1, overflow: 'auto', listStyle: 'none', padding: 0 }}>
              {envs.map((e) => (
                <li
                  key={e.id}
                  onClick={() => selectEnv(e.id!)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: e.id === selectedId ? 510 : 400,
                    background: e.id === selectedId ? 'var(--accent-brand-light)' : 'transparent',
                    color: e.id === selectedId ? 'var(--accent-brand-hover)' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontFeatureSettings: '"cv01", "ss03"',
                    transition: 'all var(--transition-normal)',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</span>
                  {e.isActive && <span style={{ fontSize: '10px', color: 'var(--status-success)', fontWeight: 510 }}>●</span>}
                </li>
              ))}
            </ul>
            {selectedId && (
              <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                <button className="btn-ghost-linear" onClick={switchEnv} style={{ padding: '4px 8px', fontSize: '11px', flex: 1 }}>{tr('activate')}</button>
                <button className="btn-ghost-linear" onClick={removeEnv} style={{ padding: '4px 8px', fontSize: '11px', flex: 1, color: 'var(--status-error)' }}>{tr('delete')}</button>
              </div>
            )}
          </div>

          {/* Right: KV editor */}
          <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column' }}>
            {selected ? (
              <>
                <input
                  className="input-linear"
                  value={envName}
                  onChange={(e) => setEnvName(e.target.value)}
                  placeholder={tr('envName')}
                  style={{ marginBottom: '12px', fontWeight: 510, fontFeatureSettings: '"cv01", "ss03"' }}
                />
                <div style={{ flex: 1, overflow: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <th style={{ width: '32px', padding: '4px', color: 'var(--text-muted)' }}>✓</th>
                        <th style={{ padding: '4px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Key</th>
                        <th style={{ padding: '4px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Value</th>
                        <th style={{ width: '32px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {vars.map((v, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '4px' }}>
                            <input type="checkbox" checked={v.enabled} onChange={(e) => updateVar(i, 'enabled', e.target.checked)}
                              style={{ accentColor: 'var(--accent-brand)', width: '14px', height: '14px' }} />
                          </td>
                          <td style={{ padding: '4px' }}>
                            <input className="input-linear" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', padding: '4px 8px' }}
                              value={v.key} onChange={(e) => updateVar(i, 'key', e.target.value)} placeholder="key" />
                          </td>
                          <td style={{ padding: '4px' }}>
                            <input className="input-linear" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', padding: '4px 8px' }}
                              value={v.value} onChange={(e) => updateVar(i, 'value', e.target.value)} placeholder="value" />
                          </td>
                          <td style={{ padding: '4px' }}>
                            <button onClick={() => removeVar(i)} style={{ color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', transition: 'color var(--transition-fast)' }}
                              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--status-error)'}
                              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button className="btn-ghost-linear" onClick={addVar} style={{ fontSize: '12px' }}>{tr('addVar')}</button>
                  <button className="btn-brand" onClick={saveEnv} style={{ fontSize: '12px' }}>{tr('saveEnv')}</button>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                {tr('selectOrCreateEnv')}
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalTransition>
  )
}
