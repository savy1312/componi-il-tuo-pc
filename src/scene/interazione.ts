import { useSyncExternalStore } from 'react'
import type { Categoria } from '../types'

/** Stato «leggero» del puntatore sulla scena 3D (cambia a ogni movimento: fuori dallo store principale). */
export interface Hover {
  cat: Categoria | null
  x: number
  y: number
}

let hover: Hover = { cat: null, x: 0, y: 0 }
const asc = new Set<() => void>()
let coda = 0

export function impostaHover(h: Hover) {
  hover = h
  if (coda) return
  coda = requestAnimationFrame(() => {
    coda = 0
    asc.forEach((f) => f())
  })
}

export const useHover = () =>
  useSyncExternalStore(
    (f) => {
      asc.add(f)
      return () => void asc.delete(f)
    },
    () => hover,
    () => hover,
  )
