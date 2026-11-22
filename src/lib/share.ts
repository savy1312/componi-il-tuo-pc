import { HARDWARE_PER_ID } from '../data/hardware'
import { RGB_DEFAULT } from '../data/palettes'
import type { ImpostazioniRgb, Progetto, Selezione } from '../types'

interface Payload {
  n: string
  s: Selezione
  r: ImpostazioniRgb
  v: boolean
}

const b64 = {
  enc: (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))),
}

export function codificaBuild(p: Progetto): string {
  const payload: Payload = { n: p.nome, s: p.sel, r: p.rgb, v: p.gpuVerticale }
  return b64.enc(JSON.stringify(payload))
}

export function linkCondivisione(p: Progetto): string {
  const base = typeof location !== 'undefined' ? location.href.split('#')[0] : ''
  return `${base}#b=${codificaBuild(p)}`
}

export interface BuildImportata {
  nome: string
  sel: Selezione
  rgb: ImpostazioniRgb
  gpuVerticale: boolean
}

/** Decodifica e valida una build condivisa, scartando gli id sconosciuti. */
export function decodificaBuild(code: string): BuildImportata | null {
  try {
    const p = JSON.parse(b64.dec(code)) as Payload
    if (!p || typeof p !== 'object' || !p.s) return null
    const ok = (id?: string) => (id && HARDWARE_PER_ID[id] ? id : undefined)
    const arr = (a: unknown) => (Array.isArray(a) ? a.filter((x): x is string => typeof x === 'string' && !!HARDWARE_PER_ID[x]) : [])
    const sel: Selezione = {
      case: ok(p.s.case),
      'scheda-madre': ok(p.s['scheda-madre']),
      cpu: ok(p.s.cpu),
      gpu: ok(p.s.gpu),
      ram: ok(p.s.ram),
      dissipatore: ok(p.s.dissipatore),
      alimentatore: ok(p.s.alimentatore),
      ssd: arr(p.s.ssd),
      ventole: arr(p.s.ventole),
      cavi: arr(p.s.cavi),
    }
    return {
      nome: typeof p.n === 'string' ? p.n.slice(0, 60) : 'Build condivisa',
      sel,
      rgb: { ...RGB_DEFAULT, ...(p.r ?? {}), bersagli: { ...RGB_DEFAULT.bersagli, ...(p.r?.bersagli ?? {}) } },
      gpuVerticale: !!p.v,
    }
  } catch {
    return null
  }
}

export function leggiHash(): string | null {
  if (typeof location === 'undefined') return null
  const m = location.hash.match(/^#b=(.+)$/)
  return m ? m[1] : null
}

export async function copiaTesto(testo: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(testo)
    return true
  } catch {
    try {
      const t = document.createElement('textarea')
      t.value = testo
      t.style.position = 'fixed'
      t.style.opacity = '0'
      document.body.appendChild(t)
      t.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(t)
      return ok
    } catch {
      return false
    }
  }
}
