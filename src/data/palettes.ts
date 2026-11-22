import type { EffettoRgb, ImpostazioniRgb } from '../types'

export interface Palette {
  id: string
  nome: string
  colori: string[]
}

export const PALETTE: Palette[] = [
  { id: 'ciano', nome: 'Ciano', colori: ['#22D3EE', '#0891B2'] },
  { id: 'viola', nome: 'Viola', colori: ['#A855F7', '#7C3AED'] },
  { id: 'rosso', nome: 'Rosso', colori: ['#EF4444', '#B91C1C'] },
  { id: 'verde', nome: 'Verde', colori: ['#34D399', '#059669'] },
  { id: 'arancione', nome: 'Arancione', colori: ['#FB923C', '#EA580C'] },
  { id: 'blu', nome: 'Blu', colori: ['#3B82F6', '#1D4ED8'] },
  { id: 'rosa', nome: 'Rosa', colori: ['#F472B6', '#DB2777'] },
  { id: 'bianco', nome: 'Bianco', colori: ['#F8FAFC', '#CBD5E1'] },
  { id: 'arcobaleno', nome: 'Arcobaleno', colori: ['#EF4444', '#F59E0B', '#34D399', '#22D3EE', '#6366F1', '#EC4899'] },
  { id: 'ghiaccio', nome: 'Ghiaccio', colori: ['#E0F2FE', '#7DD3FC', '#38BDF8'] },
  { id: 'fuoco', nome: 'Fuoco', colori: ['#FDE047', '#F97316', '#DC2626'] },
  { id: 'oceano', nome: 'Oceano', colori: ['#06B6D4', '#2563EB', '#1E3A8A'] },
  { id: 'neon', nome: 'Neon', colori: ['#39FF14', '#FF10F0', '#00E5FF'] },
  { id: 'ultravioletto', nome: 'Ultravioletto', colori: ['#6D28D9', '#A78BFA', '#4C1D95'] },
  { id: 'cyber', nome: 'Cyber', colori: ['#FDE047', '#22D3EE', '#EC4899'] },
  { id: 'toxic', nome: 'Toxic', colori: ['#A3E635', '#65A30D', '#BEF264'] },
  { id: 'sunset', nome: 'Sunset', colori: ['#F59E0B', '#EC4899', '#7C3AED'] },
  { id: 'aurora', nome: 'Aurora', colori: ['#34D399', '#22D3EE', '#A855F7'] },
]

export const PALETTE_PER_ID: Record<string, Palette> = Object.fromEntries(PALETTE.map((p) => [p.id, p]))

export const EFFETTI: { id: EffettoRgb; nome: string; descrizione: string }[] = [
  { id: 'statico', nome: 'Statico', descrizione: 'Colore fisso e uniforme.' },
  { id: 'respiro', nome: 'Respiro', descrizione: 'La luce sale e scende con un ritmo lento.' },
  { id: 'onda', nome: 'Onda', descrizione: 'Il colore scorre come un’onda tra i componenti.' },
  { id: 'arcobaleno', nome: 'Arcobaleno', descrizione: 'Ciclo continuo di tutte le tonalità.' },
  { id: 'polso', nome: 'Polso', descrizione: 'Impulsi rapidi e netti, come un battito.' },
  { id: 'reazione', nome: 'Reazione', descrizione: 'Lampi casuali che si accendono e si spengono.' },
  { id: 'cascata', nome: 'Cascata', descrizione: 'Una banda di luce attraversa i componenti.' },
  { id: 'aurora', nome: 'Aurora', descrizione: 'Sfumature morbide ispirate all’aurora boreale.' },
  { id: 'color-shift', nome: 'Cambio colore', descrizione: 'Passa lentamente da un colore all’altro.' },
]

export const RGB_DEFAULT: ImpostazioniRgb = {
  attivo: true,
  effetto: 'onda',
  palette: 'ciano',
  colore: '#22D3EE',
  intensita: 0.8,
  velocita: 0.5,
  bersagli: { ram: true, ventole: true, gpu: true, dissipatore: true },
}

/* ------------------------------------------------------------ calcolo colore */

function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

function campiona(colori: string[], x: number): [number, number, number] {
  if (colori.length === 1) return hexToRgb(colori[0])
  const pos = (((x % 1) + 1) % 1) * colori.length
  const i = Math.floor(pos)
  const f = pos - i
  const a = hexToRgb(colori[i % colori.length])
  const b = hexToRgb(colori[(i + 1) % colori.length])
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]
}

function hsl(h: number): [number, number, number] {
  const f = (n: number) => {
    const k = (n + h * 12) % 12
    return 0.5 - 0.5 * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)))
  }
  return [f(0), f(8), f(4)]
}

const rnd = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

export function coloriDi(r: ImpostazioniRgb): string[] {
  return r.palette === 'personalizzato' ? [r.colore] : (PALETTE_PER_ID[r.palette]?.colori ?? [r.colore])
}

/** Restituisce il colore [r,g,b] (0..1) e la luminosità (0..1) di un elemento RGB al tempo t. */
export function calcolaRgb(r: ImpostazioniRgb, t: number, fase: number): { rgb: [number, number, number]; lum: number } {
  const colori = coloriDi(r)
  const v = 0.3 + r.velocita * 2.2
  const tt = t * v
  switch (r.effetto) {
    case 'statico':
      return { rgb: campiona(colori, 0), lum: 1 }
    case 'respiro':
      return { rgb: campiona(colori, 0), lum: 0.15 + 0.85 * (0.5 + 0.5 * Math.sin(tt * 1.6)) }
    case 'onda':
      return { rgb: campiona(colori, tt * 0.12 - fase * 0.5), lum: 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(tt * 2 - fase * 6)) }
    case 'arcobaleno':
      return { rgb: hsl((tt * 0.1 + fase * 0.6) % 1), lum: 1 }
    case 'polso': {
      const s = 0.5 + 0.5 * Math.sin(tt * 3)
      return { rgb: campiona(colori, 0), lum: 0.1 + 0.9 * Math.pow(s, 6) }
    }
    case 'reazione': {
      const k = Math.floor(tt * 1.8 + fase * 9)
      const on = rnd(k) > 0.45
      const dec = 1 - ((tt * 1.8 + fase * 9) % 1)
      return { rgb: campiona(colori, rnd(k + 3)), lum: on ? 0.2 + 0.8 * dec : 0.1 }
    }
    case 'cascata': {
      const p = (((tt * 0.5 - fase) % 1) + 1) % 1
      return { rgb: campiona(colori, p), lum: Math.max(0.08, 1 - p * 3.2) }
    }
    case 'aurora': {
      const a = 0.5 + 0.5 * Math.sin(tt * 0.7 + fase * 4)
      return { rgb: campiona(colori, a), lum: 0.55 + 0.45 * Math.sin(tt * 1.1 + fase * 2) }
    }
    case 'color-shift':
      return { rgb: campiona(colori, tt * 0.06), lum: 1 }
  }
}

export const rgbCss = (c: [number, number, number]) => `rgb(${Math.round(c[0] * 255)}, ${Math.round(c[1] * 255)}, ${Math.round(c[2] * 255)})`
