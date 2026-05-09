import { useState, useEffect } from 'react'
import type { EnvRecord } from '../../db'
import { getActiveEnv } from '../../hooks/useEnvironment'
import EnvModal from './EnvModal'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useUiStore } from '../../store'
import { t } from '../../i18n'

export default function EnvSelector() {
  const isMobile = useIsMobile()
  const [active, setActive] = useState<EnvRecord | undefined>()
  const [modalOpen, setModalOpen] = useState(false)
  const lang = useUiStore((s) => s.lang)
  const tr = (key: string) => t[lang]?.[key] ?? key

  const load = async () => {
    setActive(await getActiveEnv())
  }

  useEffect(() => { load() }, [])

  return (
    <>
      <button
        className="btn-ghost-linear"
        onClick={() => setModalOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '3px' : '6px',
          padding: isMobile ? '0 5px' : '4px 10px',
          height: isMobile ? 26 : undefined,
          fontSize: 13,
        }}
      >
        <span style={{ fontSize: '10px', fontWeight: 590, color: 'var(--accent-brand)', fontFamily: 'var(--font-mono)' }}>ENV</span>
        {!isMobile && active && (
          <span style={{ fontSize: '13px' }}>{active.name}</span>
        )}
        {!active && <span style={{ fontSize: '13px' }}>{tr('noEnv')}</span>}
      </button>
      <EnvModal open={modalOpen} onClose={() => { setModalOpen(false); load() }} />
    </>
  )
}
