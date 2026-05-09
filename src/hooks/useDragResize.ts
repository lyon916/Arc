import { useRef, useCallback } from 'react'

interface UseDragResizeOptions {
  axis: 'x' | 'y'
  containerRef?: React.RefObject<HTMLElement | null>
  onResize: (value: number) => void
  clamp?: (value: number) => number
}

export function useDragResize({ axis, containerRef, onResize, clamp }: UseDragResizeOptions) {
  const dragging = useRef(false)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    document.body.style.cursor = axis === 'x' ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      let value: number
      if (axis === 'x') {
        value = ev.clientX
      } else {
        if (!containerRef?.current) return
        const rect = containerRef.current.getBoundingClientRect()
        value = (ev.clientY - rect.top) / rect.height
      }
      if (clamp) value = clamp(value)
      onResize(value)
    }

    const onUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [axis, containerRef, onResize, clamp])

  return onMouseDown
}
