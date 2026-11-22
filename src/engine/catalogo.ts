import { FILTRI } from '../data/categorie'
import type { FiltroDef } from '../data/categorie'
import { HARDWARE } from '../data/hardware'
import type { Categoria, Componente } from '../types'
import type { EsitoCandidato } from './compat'

export type OrdineId =
  | 'prezzo-asc'
  | 'prezzo-desc'
  | 'nome-az'
  | 'nome-za'
  | 'watt-asc'
  | 'watt-desc'
  | 'popolarita'
  | 'fascia'
  | 'compatibilita'
  | 'rilascio'
  | 'valutazione'

export const ORDINI: { id: OrdineId; nome: string }[] = [
  { id: 'popolarita', nome: 'Popolarità' },
  { id: 'prezzo-asc', nome: 'Prezzo crescente' },
  { id: 'prezzo-desc', nome: 'Prezzo decrescente' },
  { id: 'nome-az', nome: 'Nome A-Z' },
  { id: 'nome-za', nome: 'Nome Z-A' },
  { id: 'watt-asc', nome: 'Wattaggio crescente' },
  { id: 'watt-desc', nome: 'Wattaggio decrescente' },
  { id: 'fascia', nome: 'Fascia di prodotto' },
  { id: 'compatibilita', nome: 'Compatibilità' },
  { id: 'rilascio', nome: 'Data di rilascio' },
  { id: 'valutazione', nome: 'Valutazione qualitativa' },
]

export type ValoreFiltro = string[] | { min?: number; max?: number } | true
export type Filtri = Record<string, ValoreFiltro>

export interface StatoCatalogo {
  ricerca: string
  filtri: Filtri
  ordine: OrdineId
  soloCompatibili: boolean
}

export const STATO_INIZIALE: StatoCatalogo = { ricerca: '', filtri: {}, ordine: 'popolarita', soloCompatibili: false }

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

const cacheHay = new Map<string, string>()
function pagliaio(c: Componente): string {
  let h = cacheHay.get(c.id)
  if (!h) {
    h = norm(
      [c.nome, c.marca, c.modello, c.socket, c.formato, c.tipoRam, c.capacita, c.colore, c.certificazione, `${c.wattaggio}w`, c.descrizione, c.tag.join(' '), c.compatibilita.join(' '), c.fascia, c.categoria, Object.values(c.extra).join(' ')]
        .filter(Boolean)
        .join(' '),
    )
    cacheHay.set(c.id, h)
  }
  return h
}

export function corrispondeRicerca(c: Componente, q: string): boolean {
  const toks = norm(q).split(/\s+/).filter(Boolean)
  if (!toks.length) return true
  const h = pagliaio(c)
  return toks.every((t) => h.includes(t))
}

/** Opzioni disponibili per un filtro a scelta, ricavate dal catalogo della categoria. */
export function opzioniFiltro(lista: Componente[], f: FiltroDef): string[] {
  const set = new Set<string>()
  for (const c of lista) {
    const v = f.valore(c)
    if (Array.isArray(v)) v.forEach((x) => set.add(x))
    else if (v !== undefined && v !== '' && v !== false && v !== true) set.add(String(v))
  }
  const arr = [...set]
  const num = arr.every((x) => !isNaN(parseFloat(x)))
  return arr.sort((a, b) => (num ? parseFloat(a) - parseFloat(b) : a.localeCompare(b, 'it')))
}

export function limitiIntervallo(lista: Componente[], f: FiltroDef): [number, number] {
  let min = Infinity
  let max = -Infinity
  for (const c of lista) {
    const v = f.valore(c)
    if (typeof v === 'number') {
      min = Math.min(min, v)
      max = Math.max(max, v)
    }
  }
  return [min === Infinity ? 0 : Math.floor(min), max === -Infinity ? 0 : Math.ceil(max)]
}

export function corrispondeFiltri(c: Componente, cat: Categoria, filtri: Filtri): boolean {
  for (const f of FILTRI[cat]) {
    const fv = filtri[f.chiave]
    if (!fv) continue
    const v = f.valore(c)
    if (fv === true) {
      if (v !== true) return false
    } else if (Array.isArray(fv)) {
      if (!fv.length) continue
      const vals = Array.isArray(v) ? v : v === undefined ? [] : [String(v)]
      if (!fv.some((x) => vals.includes(x))) return false
    } else {
      if (typeof v !== 'number') return false
      if (fv.min !== undefined && v < fv.min) return false
      if (fv.max !== undefined && v > fv.max) return false
    }
  }
  return true
}

export function contaFiltriAttivi(filtri: Filtri): number {
  return Object.values(filtri).filter((v) => v === true || (Array.isArray(v) ? v.length > 0 : v.min !== undefined || v.max !== undefined)).length
}

const ORD_FASCIA = { 'Entry Level': 0, 'Mid Range': 1, 'High End': 2, Enthusiast: 3 }
const ORD_VAL = { Buono: 0, 'Molto buono': 1, Ottimo: 2, Eccellente: 3 }
const ORD_COMP = { ok: 0, attenzione: 1, critico: 2 }

export function ordina(lista: Componente[], ordine: OrdineId, esiti?: Map<string, EsitoCandidato>): Componente[] {
  const a = [...lista]
  const cmp: Record<OrdineId, (x: Componente, y: Componente) => number> = {
    'prezzo-asc': (x, y) => x.prezzo - y.prezzo,
    'prezzo-desc': (x, y) => y.prezzo - x.prezzo,
    'nome-az': (x, y) => x.nome.localeCompare(y.nome, 'it'),
    'nome-za': (x, y) => y.nome.localeCompare(x.nome, 'it'),
    'watt-asc': (x, y) => x.wattaggio - y.wattaggio,
    'watt-desc': (x, y) => y.wattaggio - x.wattaggio,
    popolarita: (x, y) => y.popolarita - x.popolarita,
    fascia: (x, y) => ORD_FASCIA[y.fascia] - ORD_FASCIA[x.fascia] || x.prezzo - y.prezzo,
    compatibilita: (x, y) => (ORD_COMP[esiti?.get(x.id)?.livello ?? 'ok'] - ORD_COMP[esiti?.get(y.id)?.livello ?? 'ok']) || y.popolarita - x.popolarita,
    rilascio: (x, y) => y.anno - x.anno || y.popolarita - x.popolarita,
    valutazione: (x, y) => ORD_VAL[y.valutazione] - ORD_VAL[x.valutazione] || y.popolarita - x.popolarita,
  }
  return a.sort(cmp[ordine])
}

export function elabora(cat: Categoria, st: StatoCatalogo, esiti: Map<string, EsitoCandidato>): Componente[] {
  const base = HARDWARE.filter((c) => c.categoria === cat)
  const f = base.filter((c) => {
    if (st.soloCompatibili && esiti.get(c.id)?.livello === 'critico') return false
    return corrispondeRicerca(c, st.ricerca) && corrispondeFiltri(c, cat, st.filtri)
  })
  return ordina(f, st.ordine, esiti)
}
