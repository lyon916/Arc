import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  text: string
  children: React.ReactNode
}

export default function Tooltip({ text, children }: Props) {
  const [show, setShow] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const tipRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleEnter = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPos({ x: rect.left, y: rect.bottom + 4 })
    timerRef.current = setTimeout(() => setShow(true), 400)
  }, [])

  const handleLeave = useCallback(() => {
    if (timerRef.current != null) { clearTimeout(timerRef.current); timerRef.current = null }
    setShow(false)
  }, [])

  const tipW = 420
  const clampX = pos.x + tipW > window.innerWidth ? window.innerWidth - tipW - 8 : pos.x
  const clampY = pos.y + 60 > window.innerHeight ? pos.y - 70 : pos.y

  return (
    <>
      <span onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
        {children}
      </span>
      {show && createPortal(
        <div
          ref={tipRef}
          style={{
            position: 'fixed',
            left: clampX,
            top: clampY,
            zIndex: 9999,
            maxWidth: tipW,
            padding: '8px 12px',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-primary)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-standard)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            wordBreak: 'break-all',
            lineHeight: 1.5,
            pointerEvents: 'none',
          }}
        >
          {text}
        </div>,
        document.body
      )}
    </>
  )
}
