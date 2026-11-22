import { ex } from '../data/hardware'
import { posizioneRadiatore } from '../engine/compat'
import type { Risolta } from '../engine/compat'
import type { Componente } from '../types'

/* ----------------------------------------------------------------------
 * Geometria parametrica della scena. Unità: 1 = 100 mm.
 * Assi: x = profondità (fronte del case a sinistra, retro a destra),
 *       y = altezza, z = larghezza (pannello in vetro verso +z).
 * ---------------------------------------------------------------------- */

export const mm = (v: number) => v / 100

export interface BoardSpec {
  d: number
  h: number
  cpu: [number, number]
  ramU: number[]
  ramV0: number
  ramLen: number
  pcieV: number[]
  m2: [number, number][]
  chip: [number, number]
}

export const BOARDS: Record<string, BoardSpec> = {
  ATX: { d: 244, h: 305, cpu: [100, 88], ramU: [152, 160, 168, 176], ramV0: 34, ramLen: 133, pcieV: [165, 185.3, 205.6, 225.9, 246.2], m2: [[96, 136], [96, 238], [130, 262], [150, 160]], chip: [150, 215] },
  'Micro-ATX': { d: 244, h: 244, cpu: [100, 88], ramU: [152, 160, 168, 176], ramV0: 34, ramLen: 133, pcieV: [165, 185.3, 205.6, 225.9], m2: [[96, 136], [96, 215]], chip: [150, 205] },
  'Mini-ITX': { d: 170, h: 170, cpu: [85, 70], ramU: [125, 133], ramV0: 16, ramLen: 133, pcieV: [140], m2: [[70, 118], [105, 150]], chip: [110, 125] },
}

export interface Geo {
  W: number
  H: number
  D: number
  rearX: number
  yTop: number
  zSurf: number
  zTray: number
  stile: string
  psuFormato: string
  board: BoardSpec
  haScheda: boolean
}

export function geometria(r: Risolta): Geo {
  const c = r.case
  const W = mm(ex.n(c, 'larghezza', 230))
  const H = mm(ex.n(c, 'altezza', 480))
  const D = mm(ex.n(c, 'profondita', 470))
  const formato = r['scheda-madre']?.formato ?? 'ATX'
  const board = BOARDS[formato] ?? BOARDS.ATX
  return {
    W,
    H,
    D,
    rearX: D / 2 - 0.13,
    yTop: H / 2 - (H > 4.4 ? 0.4 : 0.3),
    zSurf: -W / 2 + 0.145,
    zTray: -W / 2 + 0.04,
    stile: ex.s(c, 'stile', 'airflow'),
    psuFormato: r.alimentatore?.formato ?? 'ATX',
    board,
    haScheda: !!r['scheda-madre'],
  }
}

/** Da coordinate scheda madre (mm dal bordo posteriore e superiore) a coordinate scena. */
export const posScheda = (g: Geo, u: number, v: number): [number, number] => [g.rearX - u / 100, g.yTop - v / 100]

export interface SlotVentola {
  zona: 'front' | 'rear' | 'top'
  x: number
  y: number
  z: number
  asse: 'x' | 'y'
}

export function zoneRadiatori(c: Componente | undefined) {
  let front = 0
  let top = 0
  for (const s of c?.supportoRadiatore ?? []) {
    const [pos, size] = s.split('-')
    const n = Math.max(1, Math.floor(Number(size) / 120))
    if (pos === 'frontale' || pos === 'laterale') front = Math.max(front, n)
    if (pos === 'superiore') top = Math.max(top, n)
  }
  return { front, top }
}

/** Tutte le posizioni in cui il case può montare ventole, in ordine di riempimento. */
export function slotVentole(g: Geo, c: Componente | undefined): { front: SlotVentola[]; rear: SlotVentola[]; top: SlotVentola[] } {
  const z = zoneRadiatori(c)
  const nf = z.front || (c ? 0 : 0)
  const nt = z.top
  const yF = g.H / 2 - 0.5
  const front: SlotVentola[] = Array.from({ length: Math.min(nf, Math.floor((g.H - 1) / 1.2)) }, (_, i) => ({ zona: 'front', x: -g.D / 2 + 0.3, y: yF - 0.6 - i * 1.2, z: 0, asse: 'x' }))
  const rear: SlotVentola[] = [{ zona: 'rear', x: g.D / 2 - 0.3, y: yF - 0.6, z: 0, asse: 'x' }]
  const top: SlotVentola[] = Array.from({ length: nt }, (_, i) => ({ zona: 'top', x: g.D / 2 - 1.1 - i * 1.25, y: g.H / 2 - 0.3, z: 0, asse: 'y' }))
  return { front, rear, top }
}

export interface Ancore {
  cpu: [number, number, number]
  ram: [number, number, number]
  gpu: [number, number, number]
  ssd: [number, number, number]
  psu: [number, number, number]
  ventole: [number, number, number]
  centro: [number, number, number]
}

export function ancore(g: Geo, r: Risolta, gpuVert: boolean): Ancore {
  const [cx, cy] = posScheda(g, g.board.cpu[0], g.board.cpu[1])
  const [rx, ry] = posScheda(g, g.board.ramU[1] ?? g.board.ramU[0], g.board.ramV0 + g.board.ramLen / 2)
  const [sx, sy] = posScheda(g, g.board.m2[0][0], g.board.m2[0][1])
  const [, gy] = posScheda(g, 0, g.board.pcieV[0])
  const len = mm(r.gpu?.lunghezzaGpuMm ?? 300)
  const th = mm((ex.n(r.gpu, 'slot', 2.5)) * 20.3)
  const gpu: [number, number, number] = gpuVert ? [g.rearX - len / 2 - 0.3, g.yTop - 2.1, g.W / 2 - 0.45] : [g.rearX + 0.08 - len / 2, gy - th / 2, g.zSurf + 0.7]
  const psuH = g.psuFormato === 'SFX' ? 0.64 : 0.86
  return {
    cpu: [cx, cy, g.zSurf],
    ram: [rx, ry, g.zSurf + 0.2],
    gpu,
    ssd: [sx, sy, g.zSurf],
    psu: [g.D / 2 - 0.9, -g.H / 2 + 0.25 + psuH / 2, g.zSurf + 0.5],
    ventole: [-g.D / 2 + 0.3, g.H / 2 - 2.0, 0],
    centro: [0, 0, 0],
  }
}

export { posizioneRadiatore }
