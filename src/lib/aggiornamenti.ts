import { useCallback, useEffect, useState } from 'react'

export const VERSIONE_APP = __APP_VERSION__
export const BUILD_APP = __APP_BUILD__

export type StatoAgg = 'ok' | 'disponibile' | 'controllo' | 'offline' | 'sviluppo'

interface Remota {
  versione: string
  build: string
}

let ultima: Remota | null = null
let stato: StatoAgg = import.meta.env.PROD ? 'controllo' : 'sviluppo'
const ascoltatori = new Set<() => void>()
const notifica = () => ascoltatori.forEach((f) => f())

/** Scarica version.json dal sito (mai dalla copia salvata) e confronta con la versione in uso. */
export async function controllaAggiornamenti(): Promise<StatoAgg> {
  if (!import.meta.env.PROD || !/^https?:$/.test(location.protocol)) return stato
  stato = 'controllo'
  notifica()
  try {
    const r = await fetch(new URL(`version.json?t=${Date.now()}`, document.baseURI), { cache: 'no-store' })
    if (!r.ok) throw new Error('http')
    const dati = (await r.json()) as Remota
    ultima = dati
    stato = dati.build !== BUILD_APP ? 'disponibile' : 'ok'
  } catch {
    stato = navigator.onLine ? 'ok' : 'offline'
  }
  notifica()
  return stato
}

/** Toglie le copie salvate per uso offline e ricarica: parte la versione più recente del sito. */
export async function aggiornaOra() {
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations()) ?? []
    await Promise.all(regs.map((r) => r.unregister()))
    const chiavi = (await caches?.keys?.()) ?? []
    await Promise.all(chiavi.map((k) => caches.delete(k)))
  } catch {
    /* si ricarica comunque */
  }
  location.reload()
}

export function useAggiornamenti() {
  const [, forza] = useState(0)
  useEffect(() => {
    const f = () => forza((n) => n + 1)
    ascoltatori.add(f)
    return () => {
      ascoltatori.delete(f)
    }
  }, [])
  const controlla = useCallback(() => controllaAggiornamenti(), [])
  return { stato, nuova: ultima, controlla }
}

/** Controlla all'avvio, quando si torna sull'app e ogni 30 minuti. */
export function useControlloAutomatico() {
  useEffect(() => {
    void controllaAggiornamenti()
    const vis = () => document.visibilityState === 'visible' && void controllaAggiornamenti()
    document.addEventListener('visibilitychange', vis)
    const t = setInterval(vis, 30 * 60 * 1000)
    return () => {
      document.removeEventListener('visibilitychange', vis)
      clearInterval(t)
    }
  }, [])
}
