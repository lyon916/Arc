import { useState, useEffect } from 'react'

interface ModalTransitionProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export function ModalTransition({ open, onClose, children }: ModalTransitionProps) {
  const [visible, setVisible] = useState(false)
  const [animatingOut, setAnimatingOut] = useState(false)

  useEffect(() => {
    if (open) {
      setVisible(true)
      setAnimatingOut(false)
    } else if (visible) {
      setAnimatingOut(true)
      const timer = setTimeout(() => {
        setVisible(false)
        setAnimatingOut(false)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!visible) return null

  return (
    <div
      className={animatingOut ? 'animate-overlay-out' : 'animate-overlay-in'}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        background: 'rgba(0,0,0,0.5)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={animatingOut ? 'animate-scale-out' : 'animate-scale-in'}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-standard)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '90vw',
          maxHeight: '80vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
