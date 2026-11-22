import { useMemo } from 'react'
import * as THREE from 'three'
import { ex } from '../data/hardware'
import type { Componente } from '../types'
import { Rb, Tubo } from './gfx'
import type { V3 } from './gfx'

/* Immagini dedicate ai cavi e agli accessori: ogni tipo ha il suo aspetto, il colore arriva dalla scheda tecnica. */

const SPINA = '#e9e9ee'
const METALLO = '#b9bcc4'

/** Connettore a più file di contatti, orientato lungo +x. */
function Spina({ pos, righe = 2, colonne = 4, scala = 1, col = SPINA }: { pos: V3; righe?: number; colonne?: number; scala?: number; col?: string }) {
  const w = colonne * 0.075 * scala
  const h = righe * 0.095 * scala
  return (
    <group position={pos}>
      <Rb size={[0.22 * scala, h, w]} raggio={0.012} color={col} metal={0.05} rough={0.55} />
      {Array.from({ length: righe * colonne }, (_, i) => (
        <Rb key={i} size={[0.03, 0.045 * scala, 0.04 * scala]} pos={[0.115 * scala, ((i % righe) - (righe - 1) / 2) * 0.085 * scala, (Math.floor(i / righe) - (colonne - 1) / 2) * 0.07 * scala]} raggio={0.004} color={METALLO} metal={0.9} rough={0.25} ombra={false} />
      ))}
    </group>
  )
}

function Fascio({ da, a, n = 4, spazio = 0.075, r = 0.034, col, alto = 0.28 }: { da: V3; a: V3; n?: number; spazio?: number; r?: number; col: string; alto?: number }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const dz = (i - (n - 1) / 2) * spazio
        const pts: V3[] = [
          [da[0], da[1], da[2] + dz],
          [da[0] + (a[0] - da[0]) * 0.33, da[1] + alto, da[2] + dz * 0.6],
          [da[0] + (a[0] - da[0]) * 0.66, a[1] + alto * 0.6, a[2] + dz * 0.6],
          [a[0], a[1], a[2] + dz],
        ]
        return <Tubo key={i} pts={pts} r={r} color={col} righe seg={36} rough={0.6} />
      })}
    </>
  )
}

function Nastro({ col, lungo = 3.4, rgb = false }: { col: string; lungo?: number; rgb?: boolean }) {
  const tex = useMemo(() => {
    const cv = document.createElement('canvas')
    cv.width = 256
    cv.height = 32
    const cx = cv.getContext('2d')!
    const gr = cx.createLinearGradient(0, 0, 256, 0)
    gr.addColorStop(0, '#22d3ee')
    gr.addColorStop(0.35, '#6366f1')
    gr.addColorStop(0.7, '#ec4899')
    gr.addColorStop(1, '#f59e0b')
    cx.fillStyle = rgb ? gr : col
    cx.fillRect(0, 0, 256, 32)
    cx.fillStyle = 'rgba(0,0,0,0.35)'
    for (let x = 0; x < 256; x += 8) cx.fillRect(x, 0, 3, 32)
    const t = new THREE.CanvasTexture(cv)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [col, rgb])
  return (
    <mesh>
      <planeGeometry args={[lungo, 0.9]} />
      <meshStandardMaterial map={tex} emissiveMap={rgb ? tex : null} emissive={rgb ? '#ffffff' : '#000'} emissiveIntensity={rgb ? 0.9 : 0} side={THREE.DoubleSide} roughness={0.5} />
    </mesh>
  )
}

export function ImmagineCavo({ c }: { c: Componente }) {
  const tipo = ex.s(c, 'tipo')
  const hex = ex.s(c, 'hex') || '#17171b'
  const lung = ex.n(c, 'lunghezza')
  const nome = c.nome.toLowerCase()

  if (tipo === 'Supporto GPU') {
    return (
      <group>
        <Rb size={[1.1, 0.12, 0.8]} pos={[0, -0.9, 0]} raggio={0.04} color="#16171c" metal={0.6} rough={0.35} />
        <Rb size={[0.16, 1.7, 0.16]} pos={[0, 0, 0]} raggio={0.05} color="#202228" metal={0.7} rough={0.3} />
        <Rb size={[0.34, 0.26, 0.34]} pos={[0, 1.0, 0]} raggio={0.08} color="#2c2e36" metal={0.1} rough={0.8} />
        <Rb size={[0.42, 0.06, 0.42]} pos={[0, 0.84, 0]} raggio={0.02} color="#9ca3af" metal={0.9} rough={0.25} />
      </group>
    )
  }

  if (tipo === 'Hub RGB') {
    const rgb = ['#22d3ee', '#818cf8', '#ec4899', '#f59e0b']
    return (
      <group>
        <Rb size={[1.5, 0.28, 1.0]} raggio={0.08} color="#1c1d23" metal={0.5} rough={0.4} />
        <Rb size={[1.2, 0.03, 0.7]} pos={[0, 0.15, 0]} raggio={0.01} color="#22d3ee" emissive="#22d3ee" ei={0.6} metal={0.2} />
        {rgb.map((col, i) => (
          <group key={i}>
            <Rb size={[0.14, 0.11, 0.16]} pos={[-0.9, 0, (i - 1.5) * 0.22]} raggio={0.015} color={SPINA} metal={0.05} />
            <Tubo pts={[[-0.98, 0, (i - 1.5) * 0.22], [-1.5, 0.15, (i - 1.5) * 0.34], [-2.1, 0.05, (i - 1.5) * 0.38]]} r={0.026} color={col} seg={20} />
          </group>
        ))}
      </group>
    )
  }

  if (tipo === 'Extension' && /verticale|riser/.test(nome)) {
    return (
      <group>
        <Rb size={[3.2, 0.05, 1.2]} pos={[0, 0, 0]} raggio={0.012} color="#15161a" metal={0.2} rough={0.7} />
        {Array.from({ length: 22 }, (_, i) => (
          <Rb key={i} size={[0.07, 0.02, 1.15]} pos={[-1.5 + i * 0.14, 0.04, 0]} raggio={0.004} color="#1c1d22" ombra={false} />
        ))}
        <Rb size={[0.55, 0.28, 1.55]} pos={[-1.7, 0.08, 0]} raggio={0.03} color="#1b1c21" metal={0.3} rough={0.5} />
        <Rb size={[0.55, 0.28, 1.55]} pos={[1.7, 0.08, 0]} raggio={0.03} color="#1b1c21" metal={0.3} rough={0.5} />
        <Rb size={[1.35, 0.03, 0.12]} pos={[1.7, -0.17, 0]} raggio={0.004} color="#d4a24a" metal={1} rough={0.2} />
      </group>
    )
  }

  if (tipo === 'Extension' && /strimer|rgb/.test(nome)) {
    return (
      <group rotation={[-0.2, 0, 0]}>
        <Nastro col={hex} rgb lungo={3.2} />
        <Spina pos={[-1.7, 0, 0.0]} righe={2} colonne={12} scala={0.9} />
        <Spina pos={[1.7, 0, 0.0]} righe={2} colonne={12} scala={0.9} />
      </group>
    )
  }

  if (tipo === 'Extension') {
    // estensione 24 pin sleeved
    return (
      <group>
        <Fascio da={[-1.5, 0, 0]} a={[1.5, 0, 0]} n={12} spazio={0.075} r={0.032} col={hex} alto={0.18} />
        <Spina pos={[-1.7, 0, 0]} righe={2} colonne={12} scala={1} />
        <Spina pos={[1.7, 0, 0]} righe={2} colonne={12} scala={1} />
        {[-0.5, 0.5].map((x) => (
          <Rb key={x} size={[0.07, 0.18, 1.02]} pos={[x, 0.06, 0]} raggio={0.02} color="#24262d" metal={0.4} rough={0.5} />
        ))}
      </group>
    )
  }

  if (tipo === 'Adattatore') {
    return (
      <group>
        {[-0.45, 0, 0.45].map((z, i) => (
          <group key={i}>
            <Spina pos={[-1.55, 0, z]} righe={2} colonne={4} scala={0.75} />
            <Tubo pts={[[-1.4, 0, z], [-0.9, 0.12, z * 0.6], [-0.3, 0.05, z * 0.2], [0.3, 0, z * 0.1]]} r={0.06} color={hex} seg={28} rough={0.6} />
          </group>
        ))}
        <Spina pos={[0.55, 0, 0]} righe={2} colonne={6} scala={0.8} col="#1d1e23" />
        <Rb size={[0.14, 0.04, 0.3]} pos={[0.75, 0.2, 0]} raggio={0.01} color="#f59e0b" emissive="#f59e0b" ei={0.3} />
      </group>
    )
  }

  if (tipo === 'Cavo CPU') {
    return (
      <group>
        <Fascio da={[-1.5, 0, 0]} a={[1.5, 0, 0]} n={4} spazio={0.1} r={0.046} col={hex} alto={0.32} />
        <Spina pos={[-1.65, 0, 0]} righe={2} colonne={4} scala={1.2} />
        <Spina pos={[1.65, 0, 0]} righe={2} colonne={4} scala={1.2} />
      </group>
    )
  }

  if (tipo === 'Cavo GPU') {
    const hvpwr = ex.b(c, 'hvpwr')
    return (
      <group>
        <Fascio da={[-1.5, 0, 0]} a={[1.5, 0, 0]} n={hvpwr ? 6 : 4} spazio={0.075} r={0.04} col={hex} alto={0.4} />
        <Spina pos={[-1.65, 0, 0]} righe={2} colonne={hvpwr ? 6 : 4} scala={1.05} col={SPINA} />
        <Spina pos={[1.65, 0, 0]} righe={2} colonne={hvpwr ? 6 : 4} scala={1.05} col="#1d1e23" />
        {hvpwr && <Rb size={[0.05, 0.05, 0.32]} pos={[1.82, 0.14, 0]} raggio={0.01} color="#f59e0b" emissive="#f59e0b" ei={0.3} />}
      </group>
    )
  }

  // kit di cavi completo: 24 pin, CPU, PCIe e SATA
  const bianco = hex.toLowerCase() === '#f1f1f4'
  return (
    <group>
      <Fascio da={[-1.4, 0.55, 0]} a={[1.5, 0.55, 0]} n={10} spazio={0.07} r={0.03} col={hex} alto={0.3} />
      <Spina pos={[-1.62, 0.55, 0]} righe={2} colonne={10} scala={1} col={bianco ? '#cfd3da' : SPINA} />
      <Spina pos={[1.65, 0.55, 0]} righe={2} colonne={10} scala={1} col="#1d1e23" />
      <Fascio da={[-1.4, -0.05, 0]} a={[1.5, -0.05, 0]} n={4} spazio={0.09} r={0.04} col={hex} alto={0.35} />
      <Spina pos={[-1.62, -0.05, 0]} righe={2} colonne={4} scala={1.15} col={bianco ? '#cfd3da' : SPINA} />
      <Spina pos={[1.65, -0.05, 0]} righe={2} colonne={4} scala={1.15} col="#1d1e23" />
      <Fascio da={[-1.4, -0.62, 0]} a={[1.5, -0.62, 0]} n={5} spazio={0.075} r={0.036} col={hex} alto={0.3} />
      <Spina pos={[-1.62, -0.62, 0]} righe={2} colonne={5} scala={1.1} col={bianco ? '#cfd3da' : SPINA} />
      <Spina pos={[1.65, -0.62, 0]} righe={2} colonne={5} scala={1.1} col="#1d1e23" />
      {lung > 0 && <group />}
    </group>
  )
}
