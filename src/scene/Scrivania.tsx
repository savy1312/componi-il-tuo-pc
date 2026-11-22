import { useMemo } from 'react'
import * as THREE from 'three'
import type { ImpostazioniRgb } from '../types'
import { Cil, Istanze, Piano, Rb, RgbMat, Tubo, mat, texLegno, texSchermo, texTesto } from './gfx'

/* ----------------------------------------------------------------------
 * Ambiente "scrivania": piano in legno, monitor, tastiera, mouse, tappetino,
 * lampada e casse. Coordinate relative al centro della scrivania; la parte
 * superiore del piano si trova a y = 0.
 * ---------------------------------------------------------------------- */

export function Tastiera({ rgb }: { rgb: ImpostazioniRgb }) {
  const tasto = useMemo(() => new THREE.BoxGeometry(0.17, 0.07, 0.17), [])
  const tasti = useMemo(() => {
    const out: THREE.Matrix4[] = []
    for (let r = 0; r < 5; r++) {
      const n = r === 0 ? 14 : 13 - (r === 4 ? 3 : 0)
      for (let k = 0; k < n; k++) out.push(mat(-1.18 + k * 0.182 + (r % 2) * 0.04, 0.075, -0.45 + r * 0.19))
    }
    out.push(mat(0, 0.075, 0.5, 6.1, 1, 1))
    return out
  }, [])
  return (
    <group>
      <Rb size={[2.85, 0.1, 1.25]} pos={[0, 0.05, 0]} raggio={0.05} color="#15161a" metal={0.4} rough={0.5} />
      <Istanze geo={tasto} color="#23252c" metal={0.1} rough={0.6} matrici={tasti} />
      {/* bagliore RGB sotto i tasti */}
      <mesh position={[0, 0.102, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.78, 1.18]} />
        <RgbMat rgb={rgb} gruppo="ventole" forza={0.5} fase={0.3} />
      </mesh>
    </group>
  )
}

export function Mouse({ rgb }: { rgb: ImpostazioniRgb }) {
  return (
    <group>
      <Rb size={[0.42, 0.18, 0.7]} pos={[0, 0.1, 0]} raggio={0.09} color="#1b1c21" metal={0.3} rough={0.45} />
      <Rb size={[0.015, 0.02, 0.25]} pos={[0, 0.195, -0.12]} raggio={0.005} color="#08080a" />
      <mesh position={[0, 0.17, 0.3]}>
        <boxGeometry args={[0.2, 0.012, 0.02]} />
        <RgbMat rgb={rgb} gruppo="ventole" forza={1.2} fase={0.5} />
      </mesh>
    </group>
  )
}

export function Monitor() {
  const schermo = useMemo(() => texSchermo(0), [])
  return (
    <group>
      <Rb size={[2.4, 0.06, 1.15]} pos={[0, 0.03, 0]} raggio={0.03} color="#26272d" metal={0.6} rough={0.35} />
      <Rb size={[0.35, 1.25, 0.12]} pos={[0, 0.66, -0.12]} raggio={0.03} color="#1f2025" metal={0.55} rough={0.4} />
      <group position={[0, 1.95, 0.0]}>
        <Rb size={[5.9, 3.35, 0.13]} raggio={0.06} color="#0f1013" metal={0.5} rough={0.4} />
        <mesh position={[0, 0, 0.0655]}>
          <planeGeometry args={[5.74, 3.2]} />
          <meshStandardMaterial map={schermo} emissiveMap={schermo} emissive="#ffffff" emissiveIntensity={1.15} roughness={0.2} toneMapped={false} />
        </mesh>
        <Piano size={[0.8, 0.12]} pos={[0, -1.72, 0.0665]} mappa={texTesto('PREMIUM', { w: 256, h: 64, colore: '#7d828d', spazio: 6 })} />
      </group>
    </group>
  )
}

export function Lampada() {
  return (
    <group>
      <Cil r={0.35} h={0.05} pos={[0, 0.025, 0]} color="#18191d" metal={0.6} rough={0.4} />
      <Tubo pts={[[0, 0.05, 0], [0.04, 0.8, 0], [0.5, 1.6, 0], [1.0, 1.75, 0]]} r={0.025} color="#c3c8d0" metal={1} rough={0.3} tens={0.5} seg={32} />
      <Rb size={[0.8, 0.07, 0.25]} pos={[1.05, 1.72, 0]} raggio={0.03} color="#c3c8d0" metal={1} rough={0.3} />
      <mesh position={[1.05, 1.68, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.74, 0.19]} />
        <meshStandardMaterial color="#fff4d6" emissive="#ffe9b0" emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <pointLight position={[1.05, 1.5, 0.1]} intensity={6} distance={5} color="#ffe2a8" />
    </group>
  )
}

export function Cassa() {
  return (
    <group>
      <Rb size={[0.8, 1.5, 0.9]} pos={[0, 0.75, 0]} raggio={0.06} color="#17181c" metal={0.3} rough={0.6} />
      <Cil r={0.28} h={0.04} pos={[0, 1.0, 0.45]} rot={[Math.PI / 2, 0, 0]} color="#0b0b0d" metal={0.3} rough={0.7} />
      <Cil r={0.14} h={0.04} pos={[0, 0.4, 0.45]} rot={[Math.PI / 2, 0, 0]} color="#0b0b0d" metal={0.3} rough={0.7} />
    </group>
  )
}

/** Piano della scrivania, tappetino e oggetti. Il PC va inserito da fuori. */
export function Scrivania({ rgb, largh = 22, prof = 11 }: { rgb: ImpostazioniRgb; largh?: number; prof?: number }) {
  const legno = texLegno(9)
  return (
    <group>
      <Rb size={[largh, 0.32, prof]} pos={[0, -0.16, 0]} raggio={0.08} color="#ffffff" mappa={legno} metal={0} rough={0.55} />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => (
        <Rb key={i} size={[0.35, 7, 0.35]} pos={[a * (largh / 2 - 0.5), -3.8, b * (prof / 2 - 0.5)]} raggio={0.05} color="#1a1b20" metal={0.5} rough={0.5} />
      ))}
      {/* tappetino */}
      <Rb size={[7.6, 0.03, 2.9]} pos={[2.8, 0.015, 2.9]} raggio={0.015} color="#16171c" metal={0} rough={0.95} ombra={false} />
      <Piano size={[2.4, 0.4]} pos={[5.9, 0.0305, 4.08]} rot={[-Math.PI / 2, 0, 0]} mappa={texTesto('PRO SERIES', { w: 512, h: 96, colore: '#4c505a', spazio: 8 })} />
    </group>
  )
}
