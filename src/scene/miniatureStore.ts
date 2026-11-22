import { useEffect, useState } from 'react'
import type { Componente } from '../types'

/** Cache e coda delle miniature 3D dei componenti (il rendering vero è in Miniature.tsx). */
export const cache = new Map<string, string>()
export const coda: Componente[] = []
export const inCoda = new Set<string>()
const ascoltatori = new Set<() => void>()
export const avvisa = () => ascoltatori.forEach((f) => f())

export function iscrivi(f: () => void) {
  ascoltatori.add(f)
  return () => {
    ascoltatori.delete(f)
  }
}

export function richiediMiniatura(c: Componente) {
  if (cache.has(c.id) || inCoda.has(c.id)) return
  inCoda.add(c.id)
  coda.push(c)
  avvisa()
}

/** Toglie dalla coda un componente non più visibile (se non è già in lavorazione). */
export function annullaMiniatura(id: string) {
  const i = coda.findIndex((x) => x.id === id)
  if (i >= 0) {
    coda.splice(i, 1)
    inCoda.delete(id)
  }
}

/** Restituisce l'immagine 3D del componente (undefined finché non è pronta). */
export function useMiniatura(c: Componente): string | undefined {
  const [url, setUrl] = useState<string | undefined>(() => cache.get(c.id))
  useEffect(() => {
    const att = cache.get(c.id)
    if (att) {
      setUrl(att)
      return
    }
    setUrl(undefined)
    richiediMiniatura(c)
    const off = iscrivi(() => {
      const v = cache.get(c.id)
      if (v) setUrl(v)
    })
    return () => {
      off()
      annullaMiniatura(c.id)
    }
  }, [c])
  return url
}
