import { useRef } from 'react'
import { useUiStore } from '../../store'
import { useDragResize } from '../../hooks/useDragResize'

const MIN_RATIO = 0.2
const MAX_RATIO = 0.8

export function SplitPane({ children }: { children: [React.ReactNode, React.ReactNode] }) {
  const splitRatio = useUiStore((s) => s.splitRatio)
  const setSplitRatio = useUiStore((s) => s.setSplitRatio)
  const containerRef = useRef<HTMLDivElement>(null)

  const onMouseDown = useDragResize({
    axis: 'y',
    containerRef,
    onResize: setSplitRatio,
    clamp: (v) => Math.max(MIN_RATIO, Math.min(MAX_RATIO, v)),
  })

  const [top, bottom] = children as [React.ReactNode, React.ReactNode]

  return (
    <div ref={containerRef} className="flex flex-col flex-1 overflow-hidden">
      <div style={{ height: `${splitRatio * 100}%` }} className="overflow-auto">
        {top}
      </div>
      <div
        className="split-divider"
        onMouseDown={onMouseDown}
      />
      <div style={{ height: `${(1 - splitRatio) * 100}%` }} className="overflow-auto">
        {bottom}
      </div>
    </div>
  )
}