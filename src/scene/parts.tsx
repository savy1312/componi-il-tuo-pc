import { Edges } from '@react-three/drei'
import { useMemo } from 'react'
import type { ReactNode } from 'react'
import * as THREE from 'three'
import { ex } from '../data/hardware'
import { posizioneRadiatore } from '../engine/compat'
import type { Risolta } from '../engine/compat'
import type { Componente, ImpostazioniRgb } from '../types'
import { Alette, Cil, Istanze, LuceRgb, Piano, Rb, RgbMat, Tubo, Ventola, mat, texDisplayAio, texForata, texLamelle, texLegno, texPcb, texTesto } from './gfx'
import type { V3 } from './gfx'
import { mm, posScheda, slotVentole } from './layout'
import type { Geo } from './layout'

/* ------------------------------------------------------------------ colori */

const COL: Record<string, string> = { Nero: '#1b1c21', Bianco: '#d3d6dd', Grigio: '#5b616c', Argento: '#b7bec9', Rosso: '#c4202c', Marrone: '#a9774c', Blu: '#2f5fd0' }
export const colore = (n?: string, fallback = '#1b1c21') => (n && COL[n]) || fallback
export const eBianco = (n?: string) => n === 'Bianco'
const NERO_OPACO = '#0c0c0f'
const ACCIAIO = '#8c929d'

/* --------------------------------------------------------------- scheda madre */

export function SchedaMadre({ g, c }: { g: Geo; c: Componente }) {
  const b = g.board
  const bianca = eBianco(c.colore)
  const pcbBase = bianca ? '#cfd3da' : c.colore === 'Grigio' ? '#2c3038' : '#16181d'
  const pcbTr = bianca ? '#9aa1ad' : '#58606e'
  const metallo = bianca ? '#c9cdd5' : '#4b505c'
  const slotRam = ex.n(c, 'slotRam', 4)
  const slotM2 = ex.n(c, 'slotM2', 2)
  const sx = (u: number) => g.rearX - u / 100
  const sy = (v: number) => g.yTop - v / 100
  const z = g.zSurf
  const W = mm(b.d)
  const Hh = mm(b.h)
  const pcb = useMemo(() => texPcb(pcbBase, pcbTr, 5 + (c.id.length % 9)), [pcbBase, pcbTr, c.id])
  const marca = c.marca.replace('Gigabyte', 'GIGABYTE').toUpperCase()
  const chipset = ex.s(c, 'chipset', '')
  const hs = Hh * 0.36
  const vrm = ex.b(c, 'vrm', true)

  const vite = useMemo(() => {
    const pts: [number, number][] = [[0.18, 0.12], [0.18, 0.5], [0.18, 0.88], [0.5, 0.12], [0.5, 0.88], [0.82, 0.12], [0.82, 0.5], [0.82, 0.88]]
    return pts.map(([a, v]) => mat(g.rearX - a * W, g.yTop - v * Hh, z + 0.012))
  }, [g.rearX, g.yTop, W, Hh, z])
  const cilGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.035, 0.035, 0.06, 14)
    geo.rotateX(Math.PI / 2)
    return geo
  }, [])
  const viteGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.03, 0.03, 0.016, 12)
    geo.rotateX(Math.PI / 2)
    return geo
  }, [])
  const caps = useMemo(() => Array.from({ length: 10 }, (_, i) => mat(sx(92 + i * 9.5), sy(b.h - 20), z + 0.03)), [g.rearX, g.yTop, b.h, z]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <group>
      <Rb size={[W, Hh, 0.017]} pos={[g.rearX - W / 2, g.yTop - Hh / 2, z - 0.0085]} raggio={0.004} color={pcbBase} metal={0.1} rough={0.6} />
      <Piano size={[W, Hh]} pos={[g.rearX - W / 2, g.yTop - Hh / 2, z + 0.0004]} mappa={pcb} trasparente={false} rough={0.55} />
      <Istanze geo={viteGeo} color="#c9ced6" metal={1} rough={0.25} matrici={vite} />

      {/* socket con cornice di ritenzione */}
      <Rb size={[0.6, 0.6, 0.03]} pos={[...posScheda(g, b.cpu[0], b.cpu[1]), z + 0.015] as V3} raggio={0.01} color="#2a2c33" metal={0.3} />
      {[-0.3, 0.3].map((o) => (
        <Rb key={o} size={[0.66, 0.04, 0.045]} pos={[posScheda(g, b.cpu[0], b.cpu[1])[0], posScheda(g, b.cpu[0], b.cpu[1])[1] + o, z + 0.03]} raggio={0.01} color="#b4bac4" metal={1} rough={0.25} />
      ))}

      {/* dissipatori VRM con alette e piastra */}
      {vrm && (
        <>
          <group position={[sx(34), sy(b.cpu[1]), z + 0.03]}>
            <Rb size={[0.3, 1.3, 0.09]} pos={[0, 0, 0.045]} color={metallo} metal={0.85} rough={0.35} />
            <Alette size={[0.24, 1.24, 0.12]} pos={[0, 0, 0.15]} asse="y" n={15} color={bianca ? '#e1e4ea' : '#2b2f39'} />
          </group>
          <group position={[sx(b.cpu[0]), sy(21), z + 0.03]}>
            <Rb size={[1.45, 0.3, 0.09]} pos={[0, 0, 0.045]} color={metallo} metal={0.85} rough={0.35} />
            <Alette size={[1.4, 0.24, 0.12]} pos={[0, 0, 0.15]} asse="x" n={16} color={bianca ? '#e1e4ea' : '#2b2f39'} />
          </group>
        </>
      )}

      {/* scudo I/O con marchio */}
      <Rb size={[0.42, hs, 0.46]} pos={[sx(20), g.yTop - 0.08 - hs / 2, z + 0.23]} raggio={0.03} color={bianca ? '#dfe2e8' : '#15171c'} metal={0.55} rough={0.4} />
      <Piano size={[hs * 0.78, 0.3]} pos={[sx(20), g.yTop - 0.08 - hs / 2, z + 0.4625]} rot={[0, 0, Math.PI / 2]} mappa={texTesto(marca, { w: 512, h: 128, colore: bianca ? '#3a3f48' : '#d7dbe3', spazio: 6 })} />

      {/* chipset */}
      <Rb size={[0.62, 0.62, 0.09]} pos={[sx(b.chip[0]), sy(b.chip[1]), z + 0.05]} raggio={0.02} color={metallo} metal={0.85} rough={0.35} />
      <Piano size={[0.5, 0.2]} pos={[sx(b.chip[0]), sy(b.chip[1]), z + 0.0955]} mappa={texTesto(chipset, { w: 256, h: 80, colore: bianca ? '#3a3f48' : '#c8ccd6' })} />

      {/* slot DIMM con fermagli */}
      {b.ramU.slice(0, slotRam).map((u, i) => (
        <group key={i}>
          <Rb size={[0.095, mm(b.ramLen), 0.085]} pos={[sx(u), sy(b.ramV0 + b.ramLen / 2), z + 0.043]} raggio={0.012} color={i % 2 ? '#2a2d34' : '#3a3e48'} ombra={false} />
          <Rb size={[0.07, 0.06, 0.07]} pos={[sx(u), sy(b.ramV0 - 2), z + 0.04]} raggio={0.01} color="#d5d8de" ombra={false} />
        </group>
      ))}

      {/* slot PCIe, il primo rinforzato in metallo */}
      {b.pcieV.map((v, i) => (
        <group key={i}>
          <Rb size={[0.95, 0.13, 0.09]} pos={[sx(47), sy(v), z + 0.045]} raggio={0.015} color={i % 2 ? '#1c1f26' : '#272b34'} ombra={false} />
          {i % 2 === 0 && <Rb size={[0.97, 0.15, 0.03]} pos={[sx(47), sy(v), z + 0.095]} raggio={0.012} color="#aeb4be" metal={1} rough={0.28} ombra={false} />}
        </group>
      ))}

      {/* protezioni M.2 */}
      {b.m2.slice(0, slotM2).map(([u, v], i) => (
        <group key={i} position={[sx(u), sy(v), z + 0.02]}>
          <Rb size={[0.92, 0.27, 0.04]} raggio={0.012} color={metallo} metal={0.85} rough={0.35} ombra={false} />
          <Piano size={[0.4, 0.1]} pos={[0, 0, 0.0205]} mappa={texTesto('M.2', { w: 128, h: 48, colore: bianca ? '#454a54' : '#aab0bb' })} />
        </group>
      ))}

      {/* connettori: 24 pin, EPS, SATA, batteria, condensatori */}
      <Rb size={[0.17, 1.0, 0.13]} pos={[g.rearX - W + 0.09, g.yTop - 1.55, z + 0.07]} raggio={0.02} color="#ecebe6" ombra={false} />
      <Rb size={[0.6, 0.13, 0.16]} pos={[sx(45), g.yTop - 0.075, z + 0.08]} raggio={0.02} color="#18181b" ombra={false} />
      {[0, 1, 2, 3].map((i) => (
        <Rb key={i} size={[0.17, 0.09, 0.12]} pos={[sx(24 + i * 11), sy(b.h - 22), z + 0.06]} raggio={0.01} color={i % 2 ? '#2a5ea8' : '#d8dbe1'} ombra={false} />
      ))}
      <Cil r={0.1} h={0.035} pos={[sx(70), sy(b.h * 0.7), z + 0.02]} rot={[Math.PI / 2, 0, 0]} color="#c7ccd4" metal={1} rough={0.25} />
      <Istanze geo={cilGeo} color="#25272d" metal={0.4} rough={0.5} matrici={caps} />
    </group>
  )
}

/* ------------------------------------------------------------------- CPU */

export function Cpu({ g, c }: { g: Geo; c: Componente }) {
  const [x, y] = posScheda(g, g.board.cpu[0], g.board.cpu[1])
  const intel = c.marca === 'Intel'
  const modello = c.modello.replace(/^(AMD|Intel)\s*/i, '')
  return (
    <group position={[x, y, g.zSurf + 0.035]}>
      <Rb size={[0.5, 0.5, 0.02]} raggio={0.01} color="#2f6b3d" metal={0.2} />
      <Rb size={[intel ? 0.45 : 0.42, intel ? 0.38 : 0.42, 0.05]} pos={[0, 0, 0.035]} raggio={0.012} color="#d4d7de" metal={1} rough={0.22} />
      <Piano size={[0.38, 0.14]} pos={[0, 0, 0.0605]} mappa={texTesto(modello, { w: 512, h: 160, colore: '#6c717c', peso: 600 })} />
      {!intel && [[-0.23, 0.23], [0.23, 0.23], [-0.23, -0.23], [0.23, -0.23]].map(([dx, dy], i) => <Rb key={i} size={[0.07, 0.07, 0.01]} pos={[dx, dy, 0.015]} raggio={0.005} color="#0d0d10" />)}
    </group>
  )
}

/* ------------------------------------------------------ dissipatore ad aria */

export function Aria({ g, c, rgb }: { g: Geo; c: Componente; rgb: ImpostazioniRgb }) {
  const [x, y] = posScheda(g, g.board.cpu[0], g.board.cpu[1])
  const alto = mm(c.altezzaDissipatoreMm ?? 150)
  const basso = alto < 1.0
  const doppia = (c.numeroVentole ?? 1) > 1 && !basso
  const marrone = c.colore === 'Marrone'
  const bianco = eBianco(c.colore)
  const alu = marrone ? '#b9a58a' : bianco ? '#dfe2e8' : c.colore === 'Argento' ? '#b4bbc6' : '#c4c9d2'
  const cop = marrone ? '#cdbb9f' : bianco ? '#e8eaee' : '#15161a'
  const ventola = marrone ? '#a9835a' : bianco ? '#e1e4ea' : '#1c1c21'
  const z0 = g.zSurf + 0.06
  const zFin = z0 + 0.3
  const hFin = Math.max(0.3, alto - 0.36)
  const zc = zFin + hFin / 2
  const larg = basso ? 1.0 : 1.3
  const prof = basso ? 0.9 : doppia ? 1.5 : 0.95
  const dimV = Math.min(1.25, alto * 0.78)
  const marcaTxt = c.marca.toUpperCase()
  const tubi = [-0.34, -0.17, 0, 0.17, 0.34]
  return (
    <group>
      <Rb size={[basso ? 0.9 : 0.5, 0.5, 0.1]} pos={[x, y, z0 + 0.05]} raggio={0.02} color="#bf7a4a" metal={1} rough={0.28} />
      {/* heatpipe in rame */}
      {tubi.map((t, i) => (
        <Tubo key={i} pts={[[x + 0.05, y + t, z0 + 0.1], [x + 0.06 + (i % 2) * 0.1, y + t * 1.5, z0 + 0.22], [x + (doppia ? (i % 2 ? 0.45 : -0.45) : 0.12), y + t * 1.7, zFin + 0.05]]} r={0.028} color="#c0804f" metal={1} rough={0.3} tens={0.2} seg={16} />
      ))}
      {doppia ? (
        <>
          {[-0.45, 0.45].map((o) => (
            <group key={o}>
              <Alette size={[0.5, larg, hFin]} pos={[x + o, y, zc]} asse="z" n={34} color={alu} />
              <Rb size={[0.52, larg + 0.02, 0.04]} pos={[x + o, y, zFin + hFin + 0.02]} raggio={0.01} color={cop} metal={0.85} rough={0.3} />
            </group>
          ))}
          <Piano size={[0.9, 0.22]} pos={[x, y, zFin + hFin + 0.043]} mappa={texTesto(marcaTxt, { w: 512, h: 128, colore: marrone ? '#8a6a45' : '#cfd3da', spazio: 4 })} />
          <Ventola size={dimV} asse="x" pos={[x - 0.9, y, zc]} rgb={rgb} telaio={ventola} pale={marrone ? '#e8d9bd' : '#26262c'} />
          <Ventola size={dimV} asse="x" pos={[x, y, zc]} rgb={rgb} telaio={ventola} pale={marrone ? '#e8d9bd' : '#26262c'} />
        </>
      ) : (
        <>
          <Alette size={[prof, larg, hFin]} pos={[x + 0.1, y, zc]} asse="z" n={36} color={alu} />
          <Rb size={[prof + 0.02, larg + 0.02, 0.04]} pos={[x + 0.1, y, zFin + hFin + 0.02]} raggio={0.01} color={cop} metal={0.85} rough={0.3} />
          <Piano size={[0.7, 0.2]} pos={[x + 0.1, y, zFin + hFin + 0.043]} mappa={texTesto(marcaTxt, { w: 512, h: 128, colore: marrone ? '#8a6a45' : '#cfd3da', spazio: 4 })} />
          <Ventola size={dimV} asse="x" pos={[x - prof / 2 - 0.1, y, zc]} rgb={rgb} telaio={ventola} pale="#26262c" />
        </>
      )}
    </group>
  )
}

/* ---------------------------------------------------------------- AIO */

export function Aio({ g, c, rgb, caseC }: { g: Geo; c: Componente; rgb: ImpostazioniRgb; caseC?: Componente }) {
  const size = Number(c.formatoRadiatore ?? 240)
  const nf = size >= 360 ? 3 : 2
  const passo = size / nf / 100
  const dim = passo > 1.3 ? 1.4 : 1.2
  const pos = posizioneRadiatore(caseC, size)
  const top = pos === 'superiore'
  const [x, y] = posScheda(g, g.board.cpu[0], g.board.cpu[1])
  const zP = g.zSurf + 0.06
  const lungh = size / 100 + 0.2
  const bianco = eBianco(c.colore)
  const corpo = bianco ? '#dfe2e8' : '#17181d'
  const display = ex.b(c, 'display')
  const rgbOn = ex.b(c, 'rgb')
  const lcd = useMemo(() => texDisplayAio(c.marca, '38°'), [c.marca])
  const lam = texLamelle()

  const radC: V3 = top ? [g.D / 2 - 1.1 - ((nf - 1) * passo) / 2 - 0.1, g.H / 2 - 0.5, 0] : [-g.D / 2 + 0.58, g.H / 2 - 0.5 - 0.6 - ((nf - 1) * passo) / 2, 0]
  const portaA: V3 = top ? [radC[0] - lungh / 2 + 0.1, radC[1] - 0.1, -0.35] : [radC[0] + 0.05, radC[1] + lungh / 2 - 0.1, -0.35]
  const portaB: V3 = top ? [radC[0] - lungh / 2 + 0.1, radC[1] - 0.1, 0.35] : [radC[0] + 0.05, radC[1] + lungh / 2 - 0.1, 0.35]
  const t1: V3[] = [[x - 0.2, y + 0.15, zP + 0.25], [x - 0.9, y + 0.8, zP + 0.7], [(x + portaA[0]) / 2, (y + portaA[1]) / 2 + 0.1, 0.1], portaA]
  const t2: V3[] = [[x - 0.2, y - 0.15, zP + 0.25], [x - 0.9, y + 0.35, zP + 0.9], [(x + portaB[0]) / 2, (y + portaB[1]) / 2 + 0.25, 0.7], portaB]
  const posVentola = (i: number): V3 => (top ? [radC[0] + (i - (nf - 1) / 2) * passo, radC[1] - 0.28, 0] : [radC[0] + 0.28, radC[1] + (i - (nf - 1) / 2) * passo, 0])

  return (
    <group>
      {/* testa della pompa */}
      <Cil r={0.42} h={0.46} pos={[x, y, zP + 0.23]} rot={[Math.PI / 2, 0, 0]} color={corpo} metal={0.75} rough={0.3} seg={48} />
      <mesh position={[x, y, zP + 0.462]}>
        <torusGeometry args={[0.37, 0.022, 12, 56]} />
        {rgbOn || display ? <RgbMat rgb={rgb} gruppo="dissipatore" forza={1} fase={0.2} /> : <meshStandardMaterial color="#26272c" metalness={0.8} roughness={0.3} />}
      </mesh>
      <mesh position={[x, y, zP + 0.463]}>
        <circleGeometry args={[0.34, 48]} />
        {display ? <meshStandardMaterial map={lcd} emissiveMap={lcd} emissive="#ffffff" emissiveIntensity={0.9} roughness={0.2} toneMapped={false} /> : <meshStandardMaterial color={bianco ? '#cfd3da' : '#0d0e12'} metalness={0.85} roughness={0.22} />}
      </mesh>
      <Tubo pts={t1} r={0.075} righe color="#1a1b1f" rough={0.8} />
      <Tubo pts={t2} r={0.075} righe color="#1a1b1f" rough={0.8} />
      {/* radiatore: nucleo alettato e serbatoi laterali */}
      {top ? (
        <group position={radC}>
          <Rb size={[lungh - 0.2, 0.27, 1.22]} mappa={lam} color="#d7dbe2" metal={0.9} rough={0.4} raggio={0.01} />
          <Rb size={[0.14, 0.29, 1.28]} pos={[-lungh / 2 + 0.07, 0, 0]} raggio={0.03} color={corpo} metal={0.6} />
          <Rb size={[0.14, 0.29, 1.28]} pos={[lungh / 2 - 0.07, 0, 0]} raggio={0.03} color={corpo} metal={0.6} />
        </group>
      ) : (
        <group position={radC}>
          <Rb size={[0.27, lungh - 0.2, 1.22]} mappa={lam} color="#d7dbe2" metal={0.9} rough={0.4} raggio={0.01} />
          <Rb size={[0.29, 0.14, 1.28]} pos={[0, -lungh / 2 + 0.07, 0]} raggio={0.03} color={corpo} metal={0.6} />
          <Rb size={[0.29, 0.14, 1.28]} pos={[0, lungh / 2 - 0.07, 0]} raggio={0.03} color={corpo} metal={0.6} />
        </group>
      )}
      {Array.from({ length: nf }, (_, i) => (
        <Ventola key={i} size={dim} asse={top ? 'y' : 'x'} pos={posVentola(i)} rgb={rgb} gruppo="dissipatore" fase={i * 0.25} conRgb={rgbOn} telaio={corpo} pale={bianco ? '#cfd3da' : '#24242a'} />
      ))}
    </group>
  )
}

/* --------------------------------------------------------------------- RAM */

export function Ram({ g, c, mb, rgb }: { g: Geo; c: Componente; mb: Componente; rgb: ImpostazioniRgb }) {
  const slot = ex.n(mb, 'slotRam', 4)
  const moduli = Math.min(ex.n(c, 'moduli', 2), slot)
  const indici = moduli >= slot ? Array.from({ length: slot }, (_, i) => i) : slot === 4 ? [1, 3] : [0, 1].slice(0, moduli)
  const alt = mm(ex.n(c, 'altezzaMm', 34))
  const rgbOn = ex.b(c, 'rgb')
  const bianca = eBianco(c.colore)
  const dissip = bianca ? '#dfe2e8' : '#1f2026'
  const L = mm(g.board.ramLen) - 0.04
  const freq = ex.n(c, 'frequenza', 6000)
  const etichetta = useMemo(() => texTesto(`${c.marca.toUpperCase()}  ${c.tipoRam} ${freq}`, { w: 512, h: 96, colore: bianca ? '#3a3f48' : '#cfd3da', peso: 700, spazio: 2 }), [c.marca, c.tipoRam, freq, bianca])
  return (
    <group>
      {indici.map((idx, k) => {
        const [x, y] = posScheda(g, g.board.ramU[idx] ?? g.board.ramU[0], g.board.ramV0 + g.board.ramLen / 2)
        const z0 = g.zSurf + 0.08
        return (
          <group key={idx} position={[x, y, z0]}>
            <Rb size={[0.05, L, 0.03]} pos={[0, 0, 0.015]} raggio={0.004} color="#1c3a2a" metal={0.1} ombra={false} />
            <Rb size={[0.085, L - 0.02, alt - 0.03]} pos={[0, 0, 0.03 + (alt - 0.03) / 2]} raggio={0.016} color={dissip} metal={0.85} rough={0.32} />
            <Rb size={[0.095, L - 0.4, 0.05]} pos={[0, -0.02, alt * 0.55]} raggio={0.01} color={bianca ? '#c3c8d1' : '#2d2f37'} metal={0.9} rough={0.3} />
            {/* etichetta su entrambe le facce laterali */}
            <Piano size={[L * 0.72, 0.17]} pos={[0.0436, 0, alt * 0.45]} rot={[0, Math.PI / 2, Math.PI / 2]} mappa={etichetta} />
            <Piano size={[L * 0.72, 0.17]} pos={[-0.0436, 0, alt * 0.45]} rot={[0, -Math.PI / 2, -Math.PI / 2]} mappa={etichetta} />
            {rgbOn ? (
              <mesh position={[0, 0, alt + 0.002]}>
                <boxGeometry args={[0.068, L - 0.34, 0.03]} />
                <RgbMat rgb={rgb} gruppo="ram" fase={k * 0.2 + 0.1} forza={1.3} />
              </mesh>
            ) : (
              <Rb size={[0.07, L - 0.4, 0.012]} pos={[0, 0, alt + 0.002]} raggio={0.004} color={dissip} metal={0.85} rough={0.3} />
            )}
          </group>
        )
      })}
      {rgbOn ? <LuceRgb rgb={rgb} gruppo="ram" pos={[posScheda(g, g.board.ramU[1] ?? 152, 100)[0], posScheda(g, 150, 100)[1], g.zSurf + 0.8]} forza={0.8} /> : null}
    </group>
  )
}

/* -------------------------------------------------------------------- GPU */

export function Gpu({ g, c, rgb, verticale, pos }: { g: Geo; c: Componente; rgb: ImpostazioniRgb; verticale: boolean; pos?: V3 }) {
  const len = mm(c.lunghezzaGpuMm ?? 300)
  const slotN = ex.n(c, 'slot', 2.5)
  const th = mm(slotN * 20.3)
  const prof = 1.1 + (slotN - 2) * 0.06
  const nF = ex.n(c, 'ventole', 3)
  const bianca = eBianco(c.colore)
  const guscio = bianca ? '#d8dbe2' : '#1b1c22'
  const acc = bianca ? '#b8bdc7' : '#30323c'
  const rgbOn = ex.b(c, 'rgb')
  const dimV = Math.min(prof * 0.9, (len * 0.92) / nF)
  const [, slotY] = posScheda(g, 0, g.board.pcieV[0])
  const vertPos: V3 = [g.rearX - 0.45, g.yTop - 2.1, g.W / 2 - 0.35 - th / 2]
  const hPos: V3 = [g.rearX + 0.08, slotY - th / 2 + 0.06, g.zSurf + 0.12 + prof / 2]
  const rot: V3 = verticale ? [-Math.PI / 2, 0, 0] : [0, 0, 0]
  const p = pos ?? (verticale ? vertPos : hPos)
  const sigla = (c.nome.match(/(RTX|RX)\s?\d{3,4}[A-Za-z0-9 ]*/)?.[0] ?? c.modello).replace(/\s+(White|Edition|OC|16GB|8GB|12GB|24GB|32GB).*$/i, '').trim()
  const chip = `${c.marca === 'AMD' ? 'RADEON' : 'GEFORCE'} ${sigla}`.toUpperCase()
  const testoLogo = useMemo(() => texTesto(chip, { w: 1024, h: 128, colore: '#ffffff', sfondo: '#000000', peso: 800, spazio: 6 }), [chip])
  const testoBack = useMemo(() => texTesto(c.marca.toUpperCase(), { w: 512, h: 128, colore: bianca ? '#3b404a' : '#d6dae2', peso: 800, spazio: 8 }), [c.marca, bianca])
  const forata = useMemo(() => texForata(10, 3, true), [])
  return (
    <group position={p} rotation={rot}>
      {/* corpo: guscio, bordo laterale e backplate metallica */}
      <Rb size={[len, th, prof]} pos={[-len / 2, 0, 0]} raggio={0.05} color={guscio} metal={0.45} rough={0.45} />
      <Rb size={[len - 0.06, 0.035, prof - 0.06]} pos={[-len / 2, th / 2 + 0.012, 0]} raggio={0.012} color={acc} metal={0.95} rough={0.28} />
      <Piano size={[0.9, 0.24]} pos={[-len * 0.5, th / 2 + 0.0305, 0]} rot={[-Math.PI / 2, 0, 0]} mappa={testoBack} />
      <Rb size={[len * 0.5, 0.012, prof * 0.55]} pos={[-len * 0.78, th / 2 + 0.034, 0]} raggio={0.004} color="#15161a" metal={0.7} alpha={forata} />
      {/* staffa PCIe con porte video */}
      <Rb size={[0.035, th + 0.12, prof + 0.06]} pos={[0.03, 0, 0]} raggio={0.008} color="#a6acb7" metal={1} rough={0.3} />
      {[-0.3, 0, 0.3].map((o, i) => (
        <Rb key={i} size={[0.02, 0.07, 0.17]} pos={[0.055, 0.05, o]} raggio={0.006} color="#0a0a0c" ombra={false} />
      ))}
      <Rb size={[0.02, 0.09, 0.2]} pos={[0.055, -0.12, 0]} raggio={0.006} color="#0a0a0c" ombra={false} />
      {/* bordo luminoso con scritta */}
      <mesh position={[-len / 2, 0, prof / 2 + 0.004]}>
        <planeGeometry args={[len * 0.62, th * 0.34]} />
        <RgbMat rgb={rgb} gruppo="gpu" fase={0.4} mappa={testoLogo} forza={0.55} />
      </mesh>
      {rgbOn && (
        <mesh position={[-len + 0.14, 0, prof / 2 + 0.004]}>
          <boxGeometry args={[0.05, th * 0.7, 0.012]} />
          <RgbMat rgb={rgb} gruppo="gpu" fase={0.6} forza={1.2} />
        </mesh>
      )}
      {/* ventole rotonde sul lato inferiore */}
      {Array.from({ length: nF }, (_, i) => {
        const x = -(i + 0.5) * (len / nF)
        return <Ventola key={i} size={dimV} asse="y" pos={[x, -th / 2, 0]} rgb={rgb} gruppo="gpu" fase={i * 0.2} conRgb={rgbOn} telaio={guscio} pale="#26262c" velocita={4} tondo />
      })}
      {/* connettore di alimentazione */}
      <Rb size={[0.42, 0.14, 0.15]} pos={[-len + 0.36, th / 2 - 0.1, prof / 2 + 0.02]} raggio={0.02} color="#0b0b0d" ombra={false} />
      <Rb size={[0.32, 0.02, 0.1]} pos={[-len + 0.36, th / 2 - 0.02, prof / 2 + 0.02]} raggio={0.005} color="#d97706" ombra={false} />
      <LuceRgb rgb={rgb} gruppo="gpu" pos={[-len / 2, -th / 2 - 0.5, 0]} forza={0.9} />
    </group>
  )
}

/* -------------------------------------------------------------------- SSD */

export function Ssd({ g, c, indice, pos }: { g: Geo; c: Componente; indice: number; pos?: V3 }) {
  const etich = useMemo(() => texTesto(c.nome.replace(c.marca, '').trim(), { w: 512, h: 128, colore: '#e6e8ee', peso: 600 }), [c.nome, c.marca])
  if (c.formato === 'SATA') {
    const p: V3 = pos ?? [-g.D / 2 + 1.4 + indice * 0.05, -g.H / 2 + 1.5 + indice * 0.1, g.zTray + 0.45 + indice * 0.12]
    return (
      <group position={p}>
        <Rb size={[1.0, 0.7, 0.07]} raggio={0.02} color="#2d2f37" metal={0.85} rough={0.35} />
        <Piano size={[0.7, 0.18]} pos={[0, 0, 0.0355]} mappa={etich} />
      </group>
    )
  }
  const slot = g.board.m2[Math.min(indice, g.board.m2.length - 1)]
  const [x, y] = pos ? [pos[0], pos[1]] : posScheda(g, slot[0], slot[1])
  const heat = ex.b(c, 'dissipatore')
  const bianco = eBianco(c.colore)
  const z = pos ? pos[2] : g.zSurf + 0.045
  return (
    <group position={[x, y, z]}>
      <Rb size={[0.82, 0.22, 0.02]} raggio={0.004} color="#1d2a24" metal={0.2} />
      {[-0.28, -0.04, 0.2].map((o, i) => (
        <Rb key={i} size={[0.2, 0.15, 0.012]} pos={[o, 0, 0.015]} raggio={0.004} color="#101014" metal={0.5} ombra={false} />
      ))}
      <Piano size={[0.7, 0.16]} pos={[0.04, 0, 0.0215]} mappa={etich} />
      {heat && (
        <>
          <Rb size={[0.86, 0.27, 0.06]} pos={[0, 0, 0.065]} raggio={0.012} color={bianco ? '#d7dae1' : '#3a3d46'} metal={0.85} rough={0.3} />
          <Alette size={[0.8, 0.25, 0.06]} pos={[0, 0, 0.12]} asse="x" n={12} color="#5a5f6b" />
        </>
      )}
    </group>
  )
}

/* -------------------------------------------------------------------- PSU */

export function Psu({ g, c, pos }: { g: Geo; c: Componente; pos?: V3 }) {
  const sfx = c.formato === 'SFX'
  const L = sfx ? 1.25 : 1.6
  const A = sfx ? 0.64 : 0.86
  const Z = sfx ? 1.25 : 1.5
  const p: V3 = pos ?? [g.D / 2 - 0.13 - L / 2, -g.H / 2 + 0.2 + A / 2, g.zTray + 0.1 + Z / 2]
  const corpo = eBianco(c.colore) ? '#c9ccd3' : '#17181c'
  const mod = ex.s(c, 'modularita') === 'Full modular'
  const etich = useMemo(() => texTesto(`${c.marca.toUpperCase()}  ${c.modello}`, { w: 768, h: 128, colore: eBianco(c.colore) ? '#3a3f48' : '#dfe2e8', peso: 800, spazio: 4 }), [c.marca, c.modello, c.colore])
  const cert = useMemo(() => texTesto(`${c.wattaggio}W  ${c.certificazione ?? ''}`.trim(), { w: 512, h: 96, colore: '#8a909b', peso: 600 }), [c.wattaggio, c.certificazione])
  return (
    <group position={p}>
      <Rb size={[L, A, Z]} raggio={0.03} color={corpo} metal={0.5} rough={0.5} />
      {/* adesivo sul lato superiore e sul lato verso il vetro */}
      <Piano size={[L * 0.8, 0.2]} pos={[0, A / 2 + 0.0035, Z * 0.1]} rot={[-Math.PI / 2, 0, 0]} mappa={etich} />
      <Piano size={[L * 0.7, 0.16]} pos={[0, A * 0.1, Z / 2 + 0.0035]} mappa={etich} />
      <Piano size={[L * 0.5, 0.1]} pos={[0, -A * 0.18, Z / 2 + 0.0036]} mappa={cert} />
      {/* feritoie laterali */}
      {Array.from({ length: 7 }, (_, i) => (
        <Rb key={i} size={[L * 0.6, 0.012, 0.01]} pos={[0, A * 0.38 - i * 0.0, Z / 2 + 0.002]} raggio={0.002} color="#050506" ombra={false} />
      ))}
      <Rb size={[0.02, A * 0.82, Z * 0.84]} pos={[-L / 2 - 0.005, 0, 0]} raggio={0.006} color="#0a0a0c" />
      {mod && Array.from({ length: 6 }, (_, i) => <Rb key={i} size={[0.03, 0.14, 0.2]} pos={[-L / 2 - 0.02, A * 0.18 - Math.floor(i / 3) * 0.26, -0.5 + (i % 3) * 0.5]} raggio={0.01} color="#2d2e36" ombra={false} />)}
      <mesh position={[0, A / 2 + 0.012, Z * 0.42]}>
        <boxGeometry args={[L * 0.5, 0.005, 0.05]} />
        <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------- cavi */

export function Cavi({ g, r, rgb, verticale }: { g: Geo; r: Risolta; rgb: ImpostazioniRgb; verticale: boolean }) {
  const ps = r.alimentatore
  const mb = r['scheda-madre']
  if (!ps) return null
  const sfx = ps.formato === 'SFX'
  const L = sfx ? 1.25 : 1.6
  const A = sfx ? 0.64 : 0.86
  const px = g.D / 2 - 0.13 - L
  const py = -g.H / 2 + 0.2 + A / 2
  const pz = g.zTray + 0.1 + (sfx ? 1.25 : 1.5) / 2
  const kit = r.cavi.find((c) => ex.s(c, 'hex'))
  const hex = kit ? ex.s(kit, 'hex') : '#101013'
  const sleeved = r.cavi.some((c) => ex.b(c, 'sleeving'))
  const rad = sleeved ? 0.055 : 0.042
  const strimer = r.cavi.find((c) => c.modello.includes('Strimer'))
  const out: ReactNode[] = []
  const bx = g.rearX - mm(g.board.d)
  const rough = sleeved ? 0.88 : 0.5
  if (mb) {
    for (let k = 0; k < 3; k++) {
      const o = (k - 1) * 0.09
      out.push(<Tubo key={`a${k}`} pts={[[px, py + A / 2 - 0.05, pz + o], [px - 0.12, py + A / 2 + 0.4, pz + o + 0.1], [bx - 0.12, g.yTop - 2.1, g.zSurf + 0.3 + o * 0.5], [bx + 0.02, g.yTop - 1.55 + o, g.zSurf + 0.12]]} r={rad} color={hex} rough={rough} righe={sleeved} />)
    }
    if (r.cpu) out.push(<Tubo key="cpu" pts={[[px + 0.4, py + A / 2 - 0.04, g.zTray + 0.25], [g.rearX + 0.03, py + 0.9, g.zTray + 0.3], [g.rearX + 0.03, g.yTop - 0.5, g.zSurf + 0.06], [g.rearX - 0.45, g.yTop - 0.14, g.zSurf + 0.1]]} r={rad * 1.2} color={hex} rough={rough} righe={sleeved} />)
  }
  if (r.gpu) {
    const len = mm(r.gpu.lunghezzaGpuMm ?? 300)
    const th = mm(ex.n(r.gpu, 'slot', 2.5) * 20.3)
    const [, slotY] = posScheda(g, 0, g.board.pcieV[0])
    const prof = 1.1 + (ex.n(r.gpu, 'slot', 2.5) - 2) * 0.06
    const n = ex.b(r.gpu, 'richiede12vhpwr') ? 1 : Math.min(3, r.gpu.connettoriPCIe ?? 1)
    const gx = g.rearX + 0.08 - len + 0.35
    const gy = verticale ? g.yTop - 2.1 : slotY + 0.06
    const gz = verticale ? g.W / 2 - 0.35 - th / 2 + prof / 2 : g.zSurf + 0.12 + prof
    for (let k = 0; k < n; k++) {
      const o = (k - (n - 1) / 2) * 0.1
      out.push(<Tubo key={`g${k}`} pts={[[px, py + A / 2 - 0.02, pz + o], [px - 0.3, py + A / 2 + 0.6, g.zSurf + 0.7], [gx - 0.1 + o, gy - 0.25, gz + 0.1], [gx + o, gy + 0.02, gz + 0.03]]} r={rad} color={hex} rough={rough} righe={sleeved} />)
    }
  }
  if (strimer) {
    out.push(
      <mesh key="strimer" position={[bx + 0.08, g.yTop - 1.5, g.zSurf + 0.16]}>
        <boxGeometry args={[0.07, 1.05, 0.02]} />
        <RgbMat rgb={rgb} gruppo="ventole" fase={0.6} forza={1.2} />
      </mesh>,
    )
  }
  return <group>{out}</group>
}

/* ------------------------------------------------------------- case (guscio) */

export function Guscio({ g, c, vetro }: { g: Geo; c?: Componente; vetro: boolean }) {
  const foro = useMemo(() => texForata(Math.max(2, g.D * 3), Math.max(2, g.W * 3), true), [g.D, g.W])
  const foroF = useMemo(() => texForata(Math.max(2, g.W * 3), Math.max(2, g.H * 3), true), [g.W, g.H])
  const legno = texLegno(4)
  if (!c) {
    return (
      <group>
        <Rb size={[g.D, 0.05, g.W]} pos={[0, -g.H / 2 + 0.025, 0]} color="#101014" />
        <Rb size={[g.D, g.H, 0.04]} pos={[0, 0, g.zTray]} color="#14151a" />
        <mesh>
          <boxGeometry args={[g.D, g.H, g.W]} />
          <meshBasicMaterial visible={false} />
          <Edges color="#22d3ee" threshold={1} />
        </mesh>
      </group>
    )
  }
  const bianco = eBianco(c.colore)
  const base = bianco ? '#cfd2d9' : '#1a1b20'
  const interno = bianco ? '#c0c4cc' : '#16171b'
  const dual = g.stile === 'dual'
  const minimal = g.stile === 'minimal'
  const compact = g.stile === 'compact'
  const airflow = g.stile === 'airflow'
  const accent = ex.s(c, 'accent')
  const nSlot = Math.min(ex.n(c, 'slotPcie', 7), 8)
  const vetroTemp = ex.b(c, 'vetro')
  const fh = g.H
  const x0 = -g.D / 2
  const marca = c.marca.toUpperCase()

  return (
    <group>
      {/* base, tetto, retro, tray e pannello posteriore esterno */}
      <Rb size={[g.D, 0.08, g.W]} pos={[0, -g.H / 2 + 0.04, 0]} raggio={0.03} color={base} metal={0.45} rough={0.5} />
      {airflow || compact ? (
        <>
          {[-1, 1].map((s) => <Rb key={s} size={[g.D, 0.08, 0.3]} pos={[0, g.H / 2 - 0.04, s * (g.W / 2 - 0.15)]} raggio={0.02} color={base} metal={0.45} />)}
          {[-1, 1].map((s) => <Rb key={s} size={[0.3, 0.08, g.W - 0.6]} pos={[s * (g.D / 2 - 0.15), g.H / 2 - 0.04, 0]} raggio={0.02} color={base} metal={0.45} />)}
          <Rb size={[g.D - 0.6, 0.02, g.W - 0.6]} pos={[0, g.H / 2 - 0.04, 0]} raggio={0.005} color="#0c0c0f" metal={0.6} alpha={foro} />
        </>
      ) : (
        <Rb size={[g.D, 0.08, g.W]} pos={[0, g.H / 2 - 0.04, 0]} raggio={0.03} color={base} metal={0.45} rough={0.5} />
      )}
      <Rb size={[g.D, g.H, 0.04]} pos={[0, 0, g.zTray]} raggio={0.01} color={interno} metal={0.5} rough={0.55} />
      <Rb size={[g.D, g.H, 0.03]} pos={[0, 0, -g.W / 2 + 0.005]} raggio={0.01} color={base} metal={0.45} />
      <Rb size={[0.08, g.H, g.W]} pos={[g.D / 2 - 0.04, 0, 0]} raggio={0.02} color={base} metal={0.45} />

      {/* aperture del retro: I/O scheda madre, PSU, ventola, slot PCIe forati */}
      <Rb size={[0.09, 0.95, 1.75]} pos={[g.D / 2 - 0.04, g.yTop - 0.65, g.zSurf + 0.95]} raggio={0.01} color="#0b0b0d" ombra={false} />
      <Rb size={[0.09, 0.82, 1.5]} pos={[g.D / 2 - 0.04, -g.H / 2 + 0.55, g.zTray + 0.85]} raggio={0.01} color="#0b0b0d" ombra={false} />
      {Array.from({ length: nSlot }, (_, i) => (
        <Rb key={i} size={[0.1, 0.17, 1.25]} pos={[g.D / 2 - 0.04, g.yTop - g.board.pcieV[0] / 100 - i * 0.203, g.zSurf + 0.72]} raggio={0.008} color="#8c929d" metal={0.9} rough={0.4} alpha={foroF} ombra={false} />
      ))}

      {/* passacavi in gomma sul tray */}
      {[0.45, -0.25, -1.2].map((dy, i) => (
        <group key={i}>
          <Rb size={[0.14, 0.62, 0.03]} pos={[g.rearX - mm(g.board.d) - 0.28, g.yTop + dy - 0.5, g.zTray + 0.022]} raggio={0.06} color="#08080a" ombra={false} />
          <Rb size={[0.1, 0.56, 0.032]} pos={[g.rearX - mm(g.board.d) - 0.28, g.yTop + dy - 0.5, g.zTray + 0.024]} raggio={0.045} color="#1d1e22" ombra={false} />
        </group>
      ))}

      {/* pannello frontale in base allo stile */}
      {dual ? (
        <>
          <mesh position={[x0 + 0.05, 0, 0]}>
            <boxGeometry args={[0.04, fh - 0.1, g.W - 0.1]} />
            <meshPhysicalMaterial color="#9fb3c8" transparent opacity={0.14} roughness={0.05} metalness={0} clearcoat={1} depthWrite={false} />
          </mesh>
          <Rb size={[0.12, 0.1, g.W]} pos={[x0 + 0.06, fh / 2 - 0.05, 0]} raggio={0.02} color={base} metal={0.45} />
          <Rb size={[0.12, 0.1, g.W]} pos={[x0 + 0.06, -fh / 2 + 0.05, 0]} raggio={0.02} color={base} metal={0.45} />
        </>
      ) : airflow || compact ? (
        <>
          <Rb size={[0.1, 0.12, g.W]} pos={[x0 + 0.05, fh / 2 - 0.06, 0]} raggio={0.02} color={base} metal={0.45} />
          <Rb size={[0.1, 0.12, g.W]} pos={[x0 + 0.05, -fh / 2 + 0.06, 0]} raggio={0.02} color={base} metal={0.45} />
          {[-1, 1].map((s) => <Rb key={s} size={[0.1, fh - 0.2, 0.14]} pos={[x0 + 0.05, 0, s * (g.W / 2 - 0.07)]} raggio={0.02} color={base} metal={0.45} />)}
          <Rb size={[0.05, fh - 0.28, g.W - 0.3]} pos={[x0 + 0.05, 0, 0]} raggio={0.005} color="#0f0f12" metal={0.6} alpha={foroF} />
        </>
      ) : (
        <>
          <Rb size={[0.1, fh, g.W]} pos={[x0 + 0.05, 0, 0]} raggio={0.03} color={bianco ? '#dedfe3' : '#202126'} metal={0.2} rough={0.7} />
          {minimal && accent && Array.from({ length: 13 }, (_, i) => (
            <Rb key={i} size={[0.03, fh - 0.6, 0.11]} pos={[x0 - 0.01, 0, -g.W / 2 + 0.4 + i * ((g.W - 0.8) / 12)]} raggio={0.008} color="#ffffff" mappa={legno} metal={0} rough={0.6} ombra={false} />
          ))}
        </>
      )}

      {/* I/O frontale sul bordo superiore */}
      <group position={[x0 + 0.38, g.H / 2 + 0.002, g.W / 2 - 0.55]}>
        <Rb size={[0.46, 0.05, 0.22]} pos={[0, 0.02, 0]} raggio={0.012} color="#0e0e11" metal={0.5} ombra={false} />
        <Cil r={0.05} h={0.03} pos={[-0.15, 0.06, 0]} color="#bfc4cc" metal={1} rough={0.25} />
        {[-0.02, 0.1].map((o) => <Rb key={o} size={[0.08, 0.02, 0.1]} pos={[o + 0.04, 0.05, 0]} raggio={0.004} color="#1a3a8a" ombra={false} />)}
        <Rb size={[0.07, 0.02, 0.07]} pos={[0.2, 0.05, 0]} raggio={0.01} color="#050506" ombra={false} />
      </group>

      {/* pannello laterale in vetro temperato con viti */}
      <group visible={vetro}>
        <mesh position={[0, 0, g.W / 2 - 0.01]} renderOrder={5}>
          <boxGeometry args={[g.D - 0.1, g.H - 0.12, 0.02]} />
          <meshPhysicalMaterial color={vetroTemp ? '#a9bdd3' : '#1c2128'} transparent opacity={vetroTemp ? 0.1 : 0.32} roughness={0.03} metalness={0} clearcoat={1} clearcoatRoughness={0.04} envMapIntensity={2} depthWrite={false} />
        </mesh>
        <Rb size={[g.D - 0.06, 0.05, 0.04]} pos={[0, g.H / 2 - 0.09, g.W / 2 - 0.01]} raggio={0.01} color={base} ombra={false} />
        <Rb size={[g.D - 0.06, 0.05, 0.04]} pos={[0, -g.H / 2 + 0.09, g.W / 2 - 0.01]} raggio={0.01} color={base} ombra={false} />
        <Rb size={[0.05, g.H - 0.1, 0.04]} pos={[g.D / 2 - 0.09, 0, g.W / 2 - 0.01]} raggio={0.01} color={base} ombra={false} />
        <Rb size={[0.05, g.H - 0.1, 0.04]} pos={[-g.D / 2 + 0.09, 0, g.W / 2 - 0.01]} raggio={0.01} color={base} ombra={false} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], i) => (
          <Cil key={i} r={0.05} h={0.04} pos={[sx * (g.D / 2 - 0.12), sy * (g.H / 2 - 0.14), g.W / 2 + 0.015]} rot={[Math.PI / 2, 0, 0]} color="#c3c8d0" metal={1} rough={0.22} seg={20} ombra={false} />
        ))}
        {/* marchio del produttore sul bordo inferiore del vetro */}
        <Piano size={[0.9, 0.14]} pos={[-g.D / 2 + 0.75, -g.H / 2 + 0.2, g.W / 2 + 0.002]} mappa={texTesto(marca, { w: 512, h: 96, colore: bianco ? '#555b66' : '#c9ced8', peso: 800, spazio: 8 })} />
      </group>

      {/* piedini con gomma */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <group key={i} position={[sx * (g.D / 2 - 0.6), -g.H / 2 - 0.08, sz * (g.W / 2 - 0.4)]}>
          <Rb size={[0.55, 0.12, 0.3]} raggio={0.03} color="#0b0b0d" rough={0.8} metal={0.1} />
        </group>
      ))}
    </group>
  )
}

/* --------------------------------------------------- copertura alimentatore */

export function Copertura({ g, c }: { g: Geo; c?: Componente }) {
  if (!c || g.stile === 'dual') return null
  const sfx = g.psuFormato === 'SFX'
  const A = sfx ? 0.64 : 0.86
  const L = sfx ? 1.25 : 1.6
  const x0 = -g.D / 2 + 0.2
  const x1 = g.D / 2 - 0.13 - L - 0.05
  const lungh = Math.max(0.4, x1 - x0)
  const h = A + 0.12
  const bianco = eBianco(c.colore)
  const cx = (x0 + x1) / 2
  const marca = c.marca.toUpperCase()
  return (
    <group>
      <Rb size={[lungh, h, g.W - 0.35]} pos={[cx, -g.H / 2 + 0.07 + h / 2, 0.02]} raggio={0.03} color={bianco ? '#c7cad1' : '#0f1013'} metal={0.55} rough={0.5} />
      <Rb size={[lungh * 0.96, 0.006, 0.05]} pos={[cx, -g.H / 2 + 0.07 + h + 0.003, g.W / 2 - 0.3]} raggio={0.002} color={bianco ? '#a2a8b3' : '#2b2e37'} ombra={false} />
      <Piano size={[Math.min(1.4, lungh * 0.5), 0.2]} pos={[cx - 0.2, -g.H / 2 + 0.07 + h * 0.55, g.W / 2 - 0.1]} mappa={texTesto(marca, { w: 512, h: 128, colore: bianco ? '#5a6070' : '#8a909c', peso: 800, spazio: 10 })} />
    </group>
  )
}

export { slotVentole }
