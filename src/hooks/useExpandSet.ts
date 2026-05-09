import { useState, useCallback } from 'react'

export function useExpandSet<T extends string | number>(initial?: T[], storageKey?: string) {
  const [ids, setIds] = useState<Set<T>>(() => {
    const seed = new Set(initial ?? [])
    if (storageKey) {
      try {
        const raw = localStorage.getItem(storageKey)
        if (raw) for (const id of JSON.parse(raw)) seed.add(id as T)
      } catch { /* ignore */ }
    }
    return seed
  })

  const persist = useCallback((next: Set<T>) => {
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify([...next]))
  }, [storageKey])

  const toggle = useCallback((id: T) => {
    setIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      persist(next)
      return next
    })
  }, [persist])

  const add = useCallback((id: T) => {
    setIds((prev) => {
      const next = new Set(prev).add(id)
      persist(next)
      return next
    })
  }, [persist])

  return { ids, toggle, add }
}
