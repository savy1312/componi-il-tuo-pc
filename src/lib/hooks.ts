import { useEffect, useMemo, useState } from 'react'
import { analizza } from '../engine/compat'
import type { Analisi } from '../engine/compat'
import { useProgettoAttivo } from '../store/useStore'

export function useAnalisi(): Analisi | null {
  const p = useProgettoAttivo()
  const sel = p?.sel
  return useMemo(() => (sel ? analizza(sel) : null), [sel])
}

export function useDebounced<T>(valore: T, ms = 220): T {
  const [v, setV] = useState(valore)
  useEffect(() => {
    const t = setTimeout(() => setV(valore), ms)
    return () => clearTimeout(t)
  }, [valore, ms])
  return v
}

export function useMediaQuery(q: string): boolean {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const f = () => setM(mq.matches)
    mq.addEventListener('change', f)
    f()
    return () => mq.removeEventListener('change', f)
  }, [q])
  return m
}
