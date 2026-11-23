import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { ImpostazioniRgb } from '../types'
import { Cil, Piano, Rb, RgbMat, Tubo, texTesto } from './gfx'
import type { V3 } from './gfx'
import { creaTexturaSchermo, disegnaSchermo } from './schermo'
import type { DatiSchermo } from './schermo'

/* ----------------------------------------------------------------------
 * Postazione completa: monitor, webcam, cuffie, microfono, casse, router,
 * multipresa e tutti i cavi. Coordinate scena (y = 0 è il piano scrivania).
 * ---------------------------------------------------------------------- */

const NERO = '#17181c'
const ALLU = '#a9afb9'

/* ------------------------------------------------------------------ monitor */

export function MonitorPro({ dati }: { dati: DatiSchermo }) {
  const { cv, t } = useMemo(() => creaTexturaSchermo(), [])
  const chiave = JSON.stringify(dati)
  useEffect(() => {
    const ctx = cv.getContext('2d')!
    let vivo = true
    if (dati.modo === 'sfondo' && dati.sfondo) {
      const img = new Image()
      img.onload = () => {
        if (!vivo) return
        disegnaSchermo(ctx, dati, img)
        t.needsUpdate = true
      }
      img.src = dati.sfondo
      disegnaSchermo(ctx, { ...dati, modo: 'desktop' })
    } else disegnaSchermo(ctx, dati)
    t.needsUpdate = true
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chiave])
  const acceso = dati.modo !== 'spento'
  return (
    <group>
      {/* base e piantana */}
      <Rb size={[2.5, 0.07, 1.2]} pos={[0, 0.035, 0.05]} raggio={0.035} color="#202228" metal={0.85} rough={0.28} />
      <Rb size={[0.42, 1.3, 0.14]} pos={[0, 0.72, -0.14]} raggio={0.04} color="#1b1c21" metal={0.8} rough={0.3} />
      <Rb size={[0.6, 0.5, 0.16]} pos={[0, 1.2, -0.12]} raggio={0.05} color="#17181c" metal={0.6} rough={0.4} />
      <group position={[0, 1.95, 0]}>
        {/* pannello e cornice */}
        <Rb size={[5.9, 3.35, 0.13]} raggio={0.06} color="#0d0e11" metal={0.55} rough={0.35} />
        <Rb size={[5.5, 2.95, 0.12]} pos={[0, 0.35, -0.12]} raggio={0.05} color="#14151a" metal={0.5} rough={0.45} />
        <mesh position={[0, 0.05, 0.0655]}>
          <planeGeometry args={[5.74, 3.06]} />
          <meshStandardMaterial map={t} emissiveMap={t} emissive="#ffffff" emissiveIntensity={acceso ? 1.1 : 0} roughness={0.18} metalness={0.1} toneMapped={false} />
        </mesh>
        {/* mento: logo, LED di stato, pulsanti */}
        <Piano size={[0.9, 0.14]} pos={[0, -1.54, 0.0665]} mappa={texTesto('PREMIUM', { w: 256, h: 64, colore: '#7d828d', spazio: 6 })} />
        <mesh position={[2.55, -1.54, 0.0665]}>
          <circleGeometry args={[0.035, 16]} />
          <meshStandardMaterial color={acceso ? '#22c55e' : '#f59e0b'} emissive={acceso ? '#22c55e' : '#f59e0b'} emissiveIntensity={3} toneMapped={false} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <Rb key={i} size={[0.1, 0.05, 0.02]} pos={[2.15 - i * 0.2, -1.5, -0.075]} raggio={0.01} color="#2a2c33" metal={0.4} rough={0.5} ombra={false} />
        ))}
        {/* porte posteriori */}
        <Rb size={[1.5, 0.34, 0.06]} pos={[0, -1.18, -0.25]} raggio={0.02} color="#101115" metal={0.4} rough={0.55} />
        {[-0.55, -0.25, 0.05].map((x, i) => (
          <Rb key={i} size={[0.22, 0.08, 0.02]} pos={[x, -1.18, -0.285]} raggio={0.008} color={i === 2 ? '#2563eb' : '#050506'} ombra={false} />
        ))}
        <Rb size={[0.16, 0.1, 0.02]} pos={[0.42, -1.18, -0.285]} raggio={0.008} color="#050506" ombra={false} />
        <Rb size={[0.24, 0.14, 0.02]} pos={[0.62, -1.18, -0.285]} raggio={0.008} color="#1b1c21" ombra={false} />
      </group>
    </group>
  )
}

/* ------------------------------------------------------------------ webcam */

export function Webcam() {
  return (
    <group>
      <Rb size={[0.9, 0.22, 0.2]} pos={[0, 0.11, 0]} raggio={0.06} color="#14151a" metal={0.4} rough={0.45} />
      <Cil r={0.075} h={0.04} pos={[0, 0.12, 0.105]} rot={[Math.PI / 2, 0, 0]} color="#050507" metal={0.7} rough={0.15} />
      <Cil r={0.04} h={0.045} pos={[0, 0.12, 0.108]} rot={[Math.PI / 2, 0, 0]} color="#1c2a4a" metal={0.9} rough={0.1} />
      <mesh position={[0.22, 0.12, 0.103]}>
        <circleGeometry args={[0.014, 12]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <Rb size={[0.34, 0.05, 0.16]} pos={[0, -0.02, -0.06]} raggio={0.02} color="#1b1c21" metal={0.5} rough={0.5} />
    </group>
  )
}

/* ------------------------------------------------------------------ cuffie */

export function Cuffie({ rgb }: { rgb: ImpostazioniRgb }) {
  return (
    <group>
      {/* supporto */}
      <Cil r={0.42} h={0.06} pos={[0, 0.03, 0]} color="#18191d" metal={0.7} rough={0.35} />
      <Cil r={0.05} h={1.5} pos={[0, 0.8, 0]} color="#22242a" metal={0.8} rough={0.3} />
      <Rb size={[0.5, 0.1, 0.3]} pos={[0, 1.6, 0]} raggio={0.04} color="#2a2c33" metal={0.3} rough={0.6} />
      <group position={[0, 1.88, 0]}>
        {/* archetto */}
        <mesh rotation={[0, 0, 0]}>
          <torusGeometry args={[0.66, 0.065, 12, 40, Math.PI]} />
          <meshStandardMaterial color="#1a1b20" roughness={0.45} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.07, 0]}>
          <torusGeometry args={[0.6, 0.05, 10, 40, Math.PI]} />
          <meshStandardMaterial color="#26282f" roughness={0.9} />
        </mesh>
        {/* padiglioni */}
        {[-1, 1].map((l) => (
          <group key={l} position={[l * 0.66, 0, 0]}>
            <Cil r={0.05} h={0.28} pos={[0, -0.1, 0]} color="#2b2d34" metal={0.7} rough={0.35} />
            <Cil r={0.36} h={0.24} pos={[l * 0.14, -0.46, 0]} rot={[0, 0, Math.PI / 2]} color="#1b1c21" metal={0.35} rough={0.4} />
            <mesh position={[l * -0.02, -0.46, 0]} rotation={[0, (l * Math.PI) / 2, 0]}>
              <torusGeometry args={[0.3, 0.09, 12, 28]} />
              <meshStandardMaterial color="#202228" roughness={0.95} />
            </mesh>
            <mesh position={[l * 0.265, -0.46, 0]} rotation={[0, (l * Math.PI) / 2, 0]}>
              <ringGeometry args={[0.12, 0.2, 32]} />
              <RgbMat rgb={rgb} gruppo="ventole" forza={1.1} fase={l * 0.3} />
            </mesh>
          </group>
        ))}
        {/* braccio del microfono */}
        <Tubo pts={[[-0.8, -0.6, 0.1], [-0.9, -0.85, 0.45], [-0.5, -1.0, 0.75]]} r={0.022} color="#16171b" metal={0.4} rough={0.5} tens={0.5} seg={20} />
        <Cil r={0.05} h={0.12} pos={[-0.46, -1.02, 0.78]} rot={[0, 0, Math.PI / 2]} color="#101114" metal={0.4} rough={0.6} />
      </group>
    </group>
  )
}

/* -------------------------------------------------------------- microfono */

export function Microfono() {
  return (
    <group>
      <Cil r={0.4} h={0.07} pos={[0, 0.035, 0]} color="#1a1b20" metal={0.7} rough={0.35} />
      <Tubo pts={[[0, 0.07, 0], [0.02, 0.9, 0.05], [0.55, 1.5, 0.35], [0.55, 1.78, 0.62]]} r={0.04} color="#1d1e24" metal={0.8} rough={0.3} tens={0.5} seg={32} />
      <Cil r={0.05} h={0.12} pos={[0.55, 1.75, 0.62]} color="#2b2d34" metal={0.8} rough={0.3} />
      <group position={[0.55, 2.05, 0.62]}>
        <Cil r={0.22} h={0.62} color="#15161a" metal={0.85} rough={0.3} />
        <Cil r={0.235} h={0.4} pos={[0, 0.1, 0]} color="#8d939e" metal={0.9} rough={0.45} seg={24} />
        <mesh position={[0, 0.34, 0]}>
          <sphereGeometry args={[0.22, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#8d939e" metalness={0.9} roughness={0.5} wireframe />
        </mesh>
        <mesh position={[0, -0.12, 0.235]}>
          <circleGeometry args={[0.03, 12]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={3} toneMapped={false} />
        </mesh>
      </group>
      <Cil r={0.27} h={0.02} pos={[0.55, 2.05, 1.12]} rot={[Math.PI / 2, 0, 0]} color="#0a0a0c" metal={0.1} rough={0.9} seg={36} />
    </group>
  )
}

/* ------------------------------------------------------------------- casse */

export function CassaPro({ lato = 1 }: { lato?: 1 | -1 }) {
  return (
    <group>
      <Rb size={[0.85, 1.55, 0.95]} pos={[0, 0.78, 0]} raggio={0.07} color="#17181c" metal={0.25} rough={0.55} />
      <Rb size={[0.78, 1.45, 0.02]} pos={[0, 0.78, 0.48]} raggio={0.03} color="#0d0e10" metal={0.1} rough={0.85} />
      {/* altoparlanti: tweeter e woofer a cono */}
      <Cil r={0.15} h={0.05} pos={[0, 1.22, 0.5]} rot={[Math.PI / 2, 0, 0]} color="#0a0a0c" metal={0.4} rough={0.5} />
      <Cil r={0.09} r2={0.04} h={0.05} pos={[0, 1.22, 0.53]} rot={[Math.PI / 2, 0, 0]} color="#8d939e" metal={0.9} rough={0.3} />
      <Cil r={0.31} h={0.05} pos={[0, 0.62, 0.5]} rot={[Math.PI / 2, 0, 0]} color="#0a0a0c" metal={0.4} rough={0.5} />
      <Cil r={0.24} r2={0.1} h={0.08} pos={[0, 0.62, 0.52]} rot={[Math.PI / 2, 0, 0]} color="#1c1d22" metal={0.3} rough={0.7} />
      <Cil r={0.07} h={0.05} pos={[0, 0.62, 0.55]} rot={[Math.PI / 2, 0, 0]} color="#050506" metal={0.6} rough={0.4} />
      {/* LED e manopola del volume */}
      <mesh position={[lato * 0.25, 0.1, 0.481]}>
        <circleGeometry args={[0.018, 12]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <Cil r={0.07} h={0.06} pos={[-lato * 0.22, 0.1, 0.5]} rot={[Math.PI / 2, 0, 0]} color="#2a2c33" metal={0.85} rough={0.3} />
      {/* retro: ingressi */}
      <Rb size={[0.5, 0.25, 0.03]} pos={[0, 0.5, -0.48]} raggio={0.01} color="#0e0f12" metal={0.4} rough={0.6} ombra={false} />
      <Cil r={0.03} h={0.03} pos={[-0.12, 0.5, -0.505]} rot={[Math.PI / 2, 0, 0]} color="#050506" />
      <Cil r={0.03} h={0.03} pos={[0.12, 0.5, -0.505]} rot={[Math.PI / 2, 0, 0]} color="#a31616" />
    </group>
  )
}

/* ------------------------------------------------------------ router e prese */

export function Router() {
  return (
    <group>
      <Rb size={[1.5, 0.24, 1.0]} pos={[0, 0.12, 0]} raggio={0.06} color="#e8eaee" metal={0.1} rough={0.45} />
      {[-0.55, 0.55].map((x) => (
        <Rb key={x} size={[0.05, 0.9, 0.05]} pos={[x, 0.65, -0.35]} raggio={0.02} color="#e8eaee" metal={0.1} rough={0.45} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[-0.3 + i * 0.2, 0.12, 0.502]}>
          <circleGeometry args={[0.022, 10]} />
          <meshStandardMaterial color={i === 3 ? '#f59e0b' : '#22c55e'} emissive={i === 3 ? '#f59e0b' : '#22c55e'} emissiveIntensity={2.5} toneMapped={false} />
        </mesh>
      ))}
      {[0, 1, 2, 3].map((i) => (
        <Rb key={i} size={[0.14, 0.1, 0.03]} pos={[-0.3 + i * 0.2, 0.1, -0.505]} raggio={0.008} color="#1b1c21" ombra={false} />
      ))}
    </group>
  )
}

export function Multipresa() {
  return (
    <group>
      <Rb size={[1.6, 0.22, 0.5]} pos={[0, 0.11, 0]} raggio={0.05} color="#202228" metal={0.2} rough={0.55} />
      {[-0.55, -0.18, 0.19, 0.55].map((x) => (
        <group key={x} position={[x, 0.222, 0]}>
          <Rb size={[0.3, 0.012, 0.3]} raggio={0.006} color="#2d2f37" ombra={false} />
          <Cil r={0.028} h={0.016} pos={[-0.06, 0.008, 0]} color="#050506" ombra={false} />
          <Cil r={0.028} h={0.016} pos={[0.06, 0.008, 0]} color="#050506" ombra={false} />
        </group>
      ))}
      <Rb size={[0.14, 0.05, 0.1]} pos={[0.72, 0.245, 0.15]} raggio={0.015} color="#dc2626" emissive="#dc2626" ei={0.6} ombra={false} />
    </group>
  )
}

/* -------------------------------------------------------------------- cavi */

export interface PuntiPc {
  gpu: V3
  psu: V3
  io: V3
}

const lungo = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
void lungo

/** Tutti i cavi della postazione: ognuno parte da una porta reale e arriva al dispositivo giusto. */
export function CaviPostazione({ pc, colore }: { pc: PuntiPc; colore: string }) {
  // dal retro del PC fino al piano della scrivania, poi lungo il bordo posteriore
  const scendi = (p: V3, corsia: number, dx = 0): V3[] => [p, [p[0] + dx * 0.3, p[1] - 0.5, p[2] - 0.45], [p[0] + dx, 0.05, p[2] - 0.62 - corsia * 0.05]]
  const dietro = (corsia: number) => -5.05 - corsia * 0.07
  const X = (i: number) => -3.3 + i * 0.1 // corsie nel varco tra PC e casse
  const cavi: { k: string; pts: V3[]; r: number; col: string; righe?: boolean }[] = []

  const dalPc = (k: string, p: V3, corsia: number, colX: number, fine: V3[], r: number, col: string, righe = true) => {
    const s = scendi(p, corsia, (corsia - 3) * 0.04)
    const end = s[s.length - 1]
    cavi.push({ k, r, col, righe, pts: [...s, [end[0] + 0.1, 0.05, dietro(corsia)], [colX, 0.05, dietro(corsia)], ...fine] })
  }

  dalPc('usb-tastiera', pc.io, 0, X(0), [[X(0), 0.05, 0.2], [0.4, 0.05, 0.5], [1.5, 0.06, 0.68]], 0.034, colore)
  dalPc('usb-mouse', pc.io, 1, X(1), [[X(1), 0.05, 0.25], [3.5, 0.05, 0.5], [5.7, 0.05, 0.85], [5.9, 0.1, 1.12]], 0.03, colore)
  dalPc('usb-cuffie', pc.io, 2, X(2), [[X(2), 0.05, 0.35], [7, 0.05, 0.4], [9, 0.05, 0.7], [9.2, 0.12, 1.1]], 0.03, colore)
  dalPc('usb-microfono', pc.io, 3, X(3), [[X(3), 0.05, 0.45], [-1.9, 0.05, 0.7], [-1.3, 0.08, 0.9]], 0.03, colore)
  dalPc('usb-webcam', pc.io, 4, X(4), [[X(4), 0.05, -3.8], [1.2, 0.05, -3.8], [1.2, 0.05, -2.7], [1.2, 2.2, -2.56], [1.4, 3.3, -2.5], [1.5, 3.68, -2.48]], 0.028, colore)
  dalPc('hdmi', pc.gpu, 5, X(5), [[X(5), 0.05, -3.9], [1.75, 0.05, -3.9], [1.75, 0.05, -2.75], [1.1, 0.7, -2.55]], 0.04, '#0e0e10', false)
  dalPc('dp', pc.gpu, 6, X(6), [[X(6), 0.05, -4.0], [1.85, 0.05, -4.0], [1.85, 0.05, -2.78], [1.28, 0.7, -2.55]], 0.036, colore)
  dalPc('audio', pc.io, 7, X(7), [[X(7), 0.05, -3.5], [-2.4, 0.05, -3.5], [-2.2, 0.35, -2.98]], 0.026, colore)

  // alimentazione: dal PC e dai dispositivi alla multipresa
  const presa: V3 = [-9.5, 0.12, -5.0]
  const alPresa = (k: string, da: V3[], r: number) => cavi.push({ k, r, col: '#0d0d0f', pts: [...da, [-9.0, 0.05, dietro(8)], presa] })
  alPresa('pwr-pc', [pc.psu, [pc.psu[0] + 0.1, pc.psu[1] - 1.2, pc.psu[2] - 0.5], [pc.psu[0] + 0.2, 0.06, dietro(8)]], 0.05)
  alPresa('pwr-monitor', [[1.95, 0.7, -2.55], [2.0, 0.05, -3.0], [0, 0.05, dietro(9)]], 0.042)
  alPresa('pwr-cassa-sx', [[-2.3, 0.4, -2.98], [-2.4, 0.05, -3.4], [-3.6, 0.05, dietro(10)]], 0.036)
  alPresa('pwr-cassa-dx', [[5.8, 0.4, -2.98], [5.9, 0.05, -3.5], [4.5, 0.05, dietro(11)]], 0.036)
  // collegamento tra le due casse
  cavi.push({ k: 'audio-casse', r: 0.026, col: colore, righe: true, pts: [[-1.8, 0.35, -2.98], [-1.6, 0.05, -3.25], [2, 0.05, -3.3], [5.3, 0.05, -3.25], [5.4, 0.35, -2.98]] })
  // rete: dal PC al router
  const s = scendi(pc.io, 9, -0.1)
  cavi.push({ k: 'ethernet', r: 0.03, col: '#2563eb', pts: [...s, [s[2][0] - 0.2, 0.05, dietro(12)], [-8.6, 0.05, dietro(12)], [-9.0, 0.06, -4.1], [-9.0, 0.1, -3.7]] })
  // router → multipresa
  cavi.push({ k: 'pwr-router', r: 0.034, col: '#0d0d0f', pts: [[-9.5, 0.1, -3.7], [-9.8, 0.05, -4.3], presa] })
  // multipresa → presa a muro: scende oltre il bordo
  cavi.push({ k: 'pwr-muro', r: 0.05, col: '#0d0d0f', pts: [[-10.1, 0.12, -5.0], [-10.7, 0.04, -5.25], [-10.95, -1, -5.4], [-10.95, -7.2, -5.4]] })

  return (
    <group>
      {cavi.map((c) => (
        <Tubo key={c.k} pts={c.pts} r={c.r} color={c.col} righe={c.righe} tens={0.35} seg={72} rough={0.6} />
      ))}
    </group>
  )
}
