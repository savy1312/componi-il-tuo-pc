import { useEffect, useState } from 'react'
import { useMediaQuery } from './hooks'

interface EventoInstallazione extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let evento: EventoInstallazione | null = null
const ascoltatori = new Set<() => void>()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    evento = e as EventoInstallazione
    ascoltatori.forEach((f) => f())
  })
  window.addEventListener('appinstalled', () => {
    evento = null
    ascoltatori.forEach((f) => f())
  })
}

/** Registra il service worker (solo in produzione e su http/https): serve per l'uso offline. */
export function registraServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD || !/^https?:$/.test(location.protocol)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(new URL('sw.js', document.baseURI)).catch(() => undefined)
  })
}

const eIos = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)

/** True quando il sito gira come app installata. */
export function useInstallata(): boolean {
  const q = useMediaQuery('(display-mode: standalone)')
  return q || (typeof navigator !== 'undefined' && (navigator as unknown as { standalone?: boolean }).standalone === true)
}

/** True quando serve l'aspetto «app» (installata e schermo da telefono): barra di navigazione in basso. */
export function useModoApp(): boolean {
  const installata = useInstallata()
  const stretto = useMediaQuery('(max-width: 639px)')
  return installata && stretto
}

export function useInstallazione() {
  const [, forza] = useState(0)
  const installata = useInstallata()
  useEffect(() => {
    const f = () => forza((n) => n + 1)
    ascoltatori.add(f)
    return () => {
      ascoltatori.delete(f)
    }
  }, [])
  return {
    installata,
    puoiInstallare: !!evento && !installata,
    ios: eIos() && !installata,
    installa: async () => {
      if (!evento) return false
      await evento.prompt()
      const r = await evento.userChoice
      evento = null
      ascoltatori.forEach((f) => f())
      return r.outcome === 'accepted'
    },
  }
}
