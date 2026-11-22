import type { Preferenze } from '../store/useStore'

export type Qualita = 'alta' | 'media' | 'bassa'

/** Telefoni e tablet: schermo touch o molto stretto. */
export const eDispositivoMobile = () =>
  typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 640)

/** Qualità grafica in uso: la scelta dell'utente, altrimenti «bassa» sui telefoni (più fluida) e «alta» sul computer. */
export function qualitaEffettiva(p: Preferenze): Qualita {
  if (p.qualitaManuale && p.qualita) return p.qualita
  return eDispositivoMobile() ? 'bassa' : 'alta'
}
