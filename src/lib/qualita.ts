import { useSyncExternalStore } from 'react'
import type { Preferenze } from '../store/useStore'

export type Livello = 'bassa' | 'media' | 'alta' | 'ultra' | '4k'
/** Nome storico, ancora usato dal resto dell'app. */
export type Qualita = Livello

export const LIVELLI: Livello[] = ['bassa', 'media', 'alta', 'ultra', '4k']

export interface Profilo {
  nome: string
  descrizione: string
  /** Risoluzione massima di rendering (multiplo dei pixel dello schermo). */
  dprMax: number
  dprMin: number
  /** Lato della mappa delle ombre (0 = nessuna ombra). */
  ombre: number
  /** Post-processing attivo (bloom, tone mapping, vignettatura). */
  post: boolean
  ao: null | 'performance' | 'medium' | 'high' | 'ultra'
  aoMezza: boolean
  /** Campioni di anti-aliasing hardware. */
  msaa: number
  smaa: boolean
  bloom: number
  /** Risoluzione della mappa d'ambiente per i riflessi. */
  ambiente: number
  luci: number
  ombraContatto: number
  anisotropia: number
  /** Pavimento riflettente (riflessi reali sulla superficie d'appoggio). */
  pavimentoRiflette: boolean
}

export const PROFILI: Record<Livello, Profilo> = {
  bassa: { nome: 'Bassa', descrizione: 'Massima fluidità: telefoni e computer datati.', dprMin: 1, dprMax: 1.25, ombre: 0, post: false, ao: null, aoMezza: true, msaa: 0, smaa: false, bloom: 0, ambiente: 128, luci: 2, ombraContatto: 256, anisotropia: 2, pavimentoRiflette: false },
  media: { nome: 'Media', descrizione: 'Ombre morbide, bloom sui LED e tone mapping.', dprMin: 1, dprMax: 1.5, ombre: 1024, post: true, ao: null, aoMezza: true, msaa: 0, smaa: true, bloom: 0.5, ambiente: 256, luci: 3, ombraContatto: 512, anisotropia: 4, pavimentoRiflette: false },
  alta: { nome: 'Alta', descrizione: 'Occlusione ambientale e ombre dettagliate.', dprMin: 1, dprMax: 2, ombre: 2048, post: true, ao: 'medium', aoMezza: true, msaa: 0, smaa: true, bloom: 0.55, ambiente: 256, luci: 4, ombraContatto: 1024, anisotropia: 8, pavimentoRiflette: false },
  ultra: { nome: 'Ultra', descrizione: 'Riflessi sul pavimento, AO alta, anti-aliasing 4x.', dprMin: 1, dprMax: 2, ombre: 4096, post: true, ao: 'high', aoMezza: false, msaa: 4, smaa: false, bloom: 0.6, ambiente: 512, luci: 5, ombraContatto: 2048, anisotropia: 16, pavimentoRiflette: true },
  '4k': { nome: '4K', descrizione: 'Risoluzione piena su monitor 4K, 8x e AO massima. Richiede una GPU potente.', dprMin: 1.5, dprMax: 3, ombre: 4096, post: true, ao: 'ultra', aoMezza: false, msaa: 8, smaa: false, bloom: 0.65, ambiente: 1024, luci: 5, ombraContatto: 2048, anisotropia: 16, pavimentoRiflette: true },
}

/** Telefoni e tablet: schermo touch o molto stretto. */
export const eDispositivoMobile = () =>
  typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 640)

/** Livello massimo che l'automatico può raggiungere (il 4K si sceglie a mano). */
const tetto = (): Livello => (eDispositivoMobile() ? 'media' : 'ultra')

/* ------------------------------------------------- livello scelto in automatico */

let auto: Livello | null = null
const ascoltatori = new Set<() => void>()
const livelloAuto = (): Livello => (auto ??= eDispositivoMobile() ? 'bassa' : 'alta')
const iscrivi = (f: () => void) => {
  ascoltatori.add(f)
  return () => void ascoltatori.delete(f)
}

export function impostaAuto(l: Livello) {
  if (l === auto) return
  auto = l
  ascoltatori.forEach((f) => f())
}

/** Livello di qualità in uso: la scelta dell'utente, oppure quello scelto dall'automatico in base agli FPS. */
export function useQualita(pref: Preferenze): Livello {
  const a = useSyncExternalStore(iscrivi, livelloAuto, livelloAuto)
  return limita(pref, pref.qualitaManuale && pref.qualita ? pref.qualita : a)
}

export function qualitaEffettiva(p: Preferenze): Livello {
  return limita(p, p.qualitaManuale && p.qualita ? p.qualita : livelloAuto())
}

/** «Modalità prestazioni»: non supera mai la qualità Media. */
const limita = (p: Preferenze, l: Livello): Livello => (p.risparmio && LIVELLI.indexOf(l) > 1 ? 'media' : l)

export const modoAutomatico = (p: Preferenze) => !(p.qualitaManuale && p.qualita)

/** Un gradino più su o più giù, entro il tetto del dispositivo. */
export function vicino(l: Livello, passo: 1 | -1): Livello {
  const i = LIVELLI.indexOf(l) + passo
  const nuovo = LIVELLI[Math.max(0, Math.min(LIVELLI.length - 1, i))]
  return LIVELLI.indexOf(nuovo) > LIVELLI.indexOf(tetto()) ? l : nuovo
}

/* --------------------------------------------------------- statistiche live */

export interface Statistiche {
  fps: number
  ms: number
  chiamate: number
  triangoli: number
  risoluzione: string
}

let stat: Statistiche = { fps: 0, ms: 0, chiamate: 0, triangoli: 0, risoluzione: '' }
const ascStat = new Set<() => void>()
export const pubblicaStatistiche = (s: Statistiche) => {
  stat = s
  ascStat.forEach((f) => f())
}
export const useStatistiche = () =>
  useSyncExternalStore(
    (f) => {
      ascStat.add(f)
      return () => void ascStat.delete(f)
    },
    () => stat,
    () => stat,
  )
