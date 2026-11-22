import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { calcolaRgb } from '../data/palettes'
import type { ImpostazioniRgb } from '../types'

export type V3 = [number, number, number]
export type Bersaglio = keyof ImpostazioniRgb['bersagli']

/* ================================================================ texture */

const cache = new Map<string, THREE.Texture>()

function rng(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return ((s >>> 0) % 100000) / 100000
  }
}

function tex(key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void, opz: { repeat?: [number, number]; srgb?: boolean } = {}): THREE.CanvasTexture {
  const k = `${key}|${opz.repeat?.join('x') ?? ''}`
  const hit = cache.get(k)
  if (hit) return hit as THREE.CanvasTexture
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  const ctx = cv.getContext('2d')!
  draw(ctx, w, h)
  const t = new THREE.CanvasTexture(cv)
  t.colorSpace = opz.srgb === false ? THREE.NoColorSpace : THREE.SRGBColorSpace
  t.anisotropy = 8
  if (opz.repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(opz.repeat[0], opz.repeat[1])
  }
  t.needsUpdate = true
  cache.set(k, t)
  return t
}

/** Etichetta di testo: sfondo trasparente (o colorato) con testo centrato. */
export function texTesto(testo: string, opz: { w?: number; h?: number; colore?: string; sfondo?: string; peso?: number; px?: number; spazio?: number } = {}) {
  const { w = 512, h = 128, colore = '#ffffff', sfondo, peso = 700, px = Math.round(h * 0.52), spazio = 0 } = opz
  return tex(`t|${testo}|${w}|${h}|${colore}|${sfondo}|${peso}|${px}|${spazio}`, w, h, (c) => {
    if (sfondo) {
      c.fillStyle = sfondo
      c.fillRect(0, 0, w, h)
    }
    c.fillStyle = colore
    c.font = `${peso} ${px}px Inter, "Segoe UI", system-ui, sans-serif`
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    ;(c as unknown as { letterSpacing: string }).letterSpacing = `${spazio}px`
    c.fillText(testo, w / 2, h / 2 + px * 0.04, w * 0.94)
  })
}

/** Circuito stampato con tracce e piazzole. */
export function texPcb(base: string, traccia: string, seed = 7) {
  return tex(`pcb|${base}|${traccia}|${seed}`, 1024, 1024, (c, w, h) => {
    c.fillStyle = base
    c.fillRect(0, 0, w, h)
    const r = rng(seed)
    c.lineCap = 'round'
    for (let i = 0; i < 260; i++) {
      c.strokeStyle = traccia
      c.globalAlpha = 0.1 + r() * 0.22
      c.lineWidth = 1 + r() * 2.2
      let x = r() * w
      let y = r() * h
      c.beginPath()
      c.moveTo(x, y)
      for (let k = 0; k < 4; k++) {
        if (r() > 0.5) x += (r() - 0.5) * 220
        else y += (r() - 0.5) * 220
        c.lineTo(x, y)
      }
      c.stroke()
    }
    c.globalAlpha = 0.28
    c.fillStyle = traccia
    for (let i = 0; i < 380; i++) c.fillRect(r() * w, r() * h, 3 + r() * 5, 3 + r() * 5)
    c.globalAlpha = 1
  })
}

/** Texture forata (alphaMap): bianco = materiale pieno, nero = foro. */
export function texForata(rx: number, ry: number, esagonale = false) {
  return tex(`foro|${esagonale}`, 128, 128, (c, w, h) => {
    c.fillStyle = '#fff'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#000'
    const n = 8
    const p = w / n
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        const x = i * p + p / 2 + (esagonale && j % 2 ? p / 2 : 0)
        const y = j * p + p / 2
        c.beginPath()
        c.arc(x % w, y, p * 0.34, 0, Math.PI * 2)
        c.fill()
        if (x > w - p * 0.4) {
          c.beginPath()
          c.arc(x - w, y, p * 0.34, 0, Math.PI * 2)
          c.fill()
        }
      }
  }, { repeat: [rx, ry], srgb: false })
}

export function texLegno(seed = 3) {
  return tex(`legno|${seed}`, 1024, 512, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#7a5a3c')
    g.addColorStop(1, '#6a4b31')
    c.fillStyle = g
    c.fillRect(0, 0, w, h)
    const r = rng(seed)
    for (let i = 0; i < 220; i++) {
      c.strokeStyle = `rgba(${r() > 0.5 ? '40,24,12' : '150,110,70'},${0.05 + r() * 0.12})`
      c.lineWidth = 0.6 + r() * 2
      const y = r() * h
      c.beginPath()
      c.moveTo(0, y)
      for (let x = 0; x <= w; x += 64) c.lineTo(x, y + Math.sin(x * 0.01 + i) * (2 + r() * 3))
      c.stroke()
    }
  })
}

export function texLamelle() {
  return tex('lamelle', 64, 256, (c, w, h) => {
    c.fillStyle = '#b8bdc6'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#6d727c'
    for (let y = 0; y < h; y += 8) c.fillRect(0, y, w, 4)
  }, { repeat: [1, 1] })
}

export function texSchermo(variante = 0) {
  return tex(`schermo|${variante}`, 1280, 720, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, h)
    g.addColorStop(0, ['#0b1730', '#190b30', '#06242a'][variante % 3])
    g.addColorStop(0.5, ['#13408a', '#5a1d9c', '#0b6b73'][variante % 3])
    g.addColorStop(1, ['#0a0f1f', '#0f0820', '#04141a'][variante % 3])
    c.fillStyle = g
    c.fillRect(0, 0, w, h)
    const r = rng(11)
    for (let i = 0; i < 6; i++) {
      const rg = c.createRadialGradient(r() * w, r() * h, 10, r() * w, r() * h, 300 + r() * 200)
      rg.addColorStop(0, 'rgba(120,200,255,0.25)')
      rg.addColorStop(1, 'rgba(0,0,0,0)')
      c.fillStyle = rg
      c.fillRect(0, 0, w, h)
    }
    c.fillStyle = 'rgba(255,255,255,0.12)'
    c.fillRect(0, h - 52, w, 52)
    c.fillStyle = 'rgba(255,255,255,0.7)'
    for (let i = 0; i < 6; i++) c.fillRect(24 + i * 54, h - 40, 30, 28)
    c.fillStyle = '#fff'
    c.font = '600 22px Inter, system-ui, sans-serif'
    c.textAlign = 'right'
    c.fillText('12:30', w - 24, h - 20)
  })
}

export function texDisplayAio(testo: string, temp = '38°') {
  return tex(`aio|${testo}|${temp}`, 256, 256, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2)
    g.addColorStop(0, '#0b2a3a')
    g.addColorStop(1, '#030b12')
    c.fillStyle = g
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#7de3ff'
    c.textAlign = 'center'
    c.font = '700 84px Inter, system-ui, sans-serif'
    c.fillText(temp, w / 2, h / 2 + 18)
    c.font = '600 24px Inter, system-ui, sans-serif'
    c.fillStyle = '#9bb6c4'
    c.fillText(testo, w / 2, h / 2 + 62)
    c.strokeStyle = '#22d3ee'
    c.lineWidth = 6
    c.beginPath()
    c.arc(w / 2, h / 2, w * 0.43, Math.PI * 0.75, Math.PI * 2.1)
    c.stroke()
  })
}

/* ============================================================== primitive */

interface RbProps {
  size: V3
  pos?: V3
  rot?: V3
  raggio?: number
  color?: string
  metal?: number
  rough?: number
  ombra?: boolean
  emissive?: string
  ei?: number
  mappa?: THREE.Texture | null
  alpha?: THREE.Texture | null
  trasparente?: number
  clearcoat?: number
  children?: ReactNode
}

/** Parallelepipedo con spigoli smussati: la base di quasi tutti i componenti. */
export function Rb({ size, pos = [0, 0, 0], rot, raggio, color = '#17171b', metal = 0.4, rough = 0.5, ombra = true, emissive, ei = 0, mappa, alpha, trasparente, clearcoat = 0, children }: RbProps) {
  const r = Math.min(raggio ?? 0.018, Math.min(...size) / 2 - 0.001)
  return (
    <RoundedBox args={size} radius={Math.max(0.002, r)} smoothness={3} position={pos} rotation={rot} castShadow={ombra} receiveShadow>
      <meshPhysicalMaterial color={color} metalness={metal} roughness={rough} emissive={emissive ?? '#000'} emissiveIntensity={ei} map={mappa ?? null} alphaMap={alpha ?? null} alphaTest={alpha ? 0.5 : 0} transparent={trasparente !== undefined} opacity={trasparente ?? 1} clearcoat={clearcoat} clearcoatRoughness={0.25} side={alpha ? THREE.DoubleSide : THREE.FrontSide} />
      {children}
    </RoundedBox>
  )
}

/** Piano con texture (etichette, tracce, schermi). Guarda verso +z. */
export function Piano({ size, pos, rot, mappa, emissiva, color = '#ffffff', trasparente = true, rough = 0.6, metal = 0, ei = 0 }: { size: [number, number]; pos: V3; rot?: V3; mappa?: THREE.Texture | null; emissiva?: THREE.Texture | null; color?: string; trasparente?: boolean; rough?: number; metal?: number; ei?: number }) {
  return (
    <mesh position={pos} rotation={rot}>
      <planeGeometry args={size} />
      <meshStandardMaterial map={mappa ?? null} emissiveMap={emissiva ?? null} emissive={emissiva ? '#ffffff' : '#000'} emissiveIntensity={ei} color={color} transparent={trasparente} roughness={rough} metalness={metal} polygonOffset polygonOffsetFactor={-2} depthWrite={false} toneMapped={!emissiva} />
    </mesh>
  )
}

export function Cil({ r, h, pos = [0, 0, 0], rot, color = '#17171b', metal = 0.6, rough = 0.35, seg = 32, r2, ombra = true }: { r: number; h: number; pos?: V3; rot?: V3; color?: string; metal?: number; rough?: number; seg?: number; r2?: number; ombra?: boolean }) {
  return (
    <mesh position={pos} rotation={rot} castShadow={ombra} receiveShadow>
      <cylinderGeometry args={[r, r2 ?? r, h, seg]} />
      <meshStandardMaterial color={color} metalness={metal} roughness={rough} />
    </mesh>
  )
}

export function Tubo({ pts, r = 0.05, color = '#0e0e10', rough = 0.55, metal = 0.1, tens = 0.45, seg = 64, righe = false }: { pts: V3[]; r?: number; color?: string; rough?: number; metal?: number; tens?: number; seg?: number; righe?: boolean }) {
  const curva = useMemo(() => new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', tens), [pts, tens])
  const nastro = useMemo(() => (righe ? tex('rete', 64, 64, (c, w, h) => { c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); c.fillStyle = '#bbb'; for (let i = 0; i < w; i += 8) c.fillRect(i, 0, 3, h) }, { repeat: [1, 40] }) : null), [righe])
  return (
    <mesh castShadow receiveShadow>
      <tubeGeometry args={[curva, seg, r, 12, false]} />
      <meshStandardMaterial color={color} roughness={rough} metalness={metal} map={nastro} />
    </mesh>
  )
}

/* ============================================================ materiale RGB */

/** Materiale emissivo animato che segue le impostazioni RGB. */
export function RgbMat({ rgb, gruppo, fase = 0, forza = 1, attivo = true, base = '#0d0d10', mappa }: { rgb: ImpostazioniRgb; gruppo: Bersaglio; fase?: number; forza?: number; attivo?: boolean; base?: string; mappa?: THREE.Texture | null }) {
  const ref = useRef<THREE.MeshStandardMaterial>(null)
  const on = rgb.attivo && rgb.bersagli[gruppo] && attivo
  useFrame(({ clock }) => {
    const m = ref.current
    if (!m) return
    if (!on) {
      m.emissiveIntensity = 0
      return
    }
    const { rgb: c, lum } = calcolaRgb(rgb, clock.elapsedTime, fase)
    m.emissive.setRGB(c[0], c[1], c[2])
    m.emissiveIntensity = lum * rgb.intensita * forza * 2.2
  })
  return <meshStandardMaterial ref={ref} color={base} emissive="#000" emissiveIntensity={0} emissiveMap={mappa ?? null} roughness={0.35} metalness={0.1} toneMapped={false} />
}

export function LuceRgb({ rgb, gruppo, pos, forza = 1, fase = 0 }: { rgb: ImpostazioniRgb; gruppo: Bersaglio; pos: V3; forza?: number; fase?: number }) {
  const ref = useRef<THREE.PointLight>(null)
  const on = rgb.attivo && rgb.bersagli[gruppo]
  useFrame(({ clock }) => {
    const l = ref.current
    if (!l) return
    if (!on) {
      l.intensity = 0
      return
    }
    const { rgb: c, lum } = calcolaRgb(rgb, clock.elapsedTime, fase)
    l.color.setRGB(c[0], c[1], c[2])
    l.intensity = lum * rgb.intensita * forza * 2.6
  })
  return <pointLight ref={ref} position={pos} distance={4.2} decay={2} intensity={0} />
}

/* ================================================================== ventola */

const geoCache = new Map<string, THREE.BufferGeometry>()

function geoTelaio(s: number): THREE.BufferGeometry {
  const k = `tel${s}`
  const hit = geoCache.get(k)
  if (hit) return hit
  const r = s * 0.07
  const h = s / 2
  const sh = new THREE.Shape()
  sh.moveTo(-h + r, -h)
  sh.lineTo(h - r, -h)
  sh.absarc(h - r, -h + r, r, -Math.PI / 2, 0)
  sh.lineTo(h, h - r)
  sh.absarc(h - r, h - r, r, 0, Math.PI / 2)
  sh.lineTo(-h + r, h)
  sh.absarc(-h + r, h - r, r, Math.PI / 2, Math.PI)
  sh.lineTo(-h, -h + r)
  sh.absarc(-h + r, -h + r, r, Math.PI, Math.PI * 1.5)
  const hole = new THREE.Path()
  hole.absarc(0, 0, s * 0.455, 0, Math.PI * 2, true)
  sh.holes.push(hole)
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2, curveSegments: 28 })
  g.translate(0, 0, -0.11)
  geoCache.set(k, g)
  return g
}

function geoPale(s: number, n = 9): THREE.BufferGeometry {
  const k = `pale${s}${n}`
  const hit = geoCache.get(k)
  if (hit) return hit
  const r0 = s * 0.12
  const r1 = s * 0.455
  const pezzi: THREE.BufferGeometry[] = []
  for (let i = 0; i < n; i++) {
    const sh = new THREE.Shape()
    const A = (t: number) => t * 0.5
    const Wd = (t: number) => (0.16 + 0.42 * Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.06))) * 0.6
    const punti = 14
    const a: [number, number][] = []
    const b: [number, number][] = []
    for (let j = 0; j <= punti; j++) {
      const t = j / punti
      const r = r0 + (r1 - r0) * t
      a.push([r * Math.cos(A(t)), r * Math.sin(A(t))])
      b.push([r * Math.cos(A(t) + Wd(t)), r * Math.sin(A(t) + Wd(t))])
    }
    sh.moveTo(a[0][0], a[0][1])
    a.forEach((p) => sh.lineTo(p[0], p[1]))
    b.reverse().forEach((p) => sh.lineTo(p[0], p[1]))
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: false })
    g.translate(0, 0, -0.006)
    // inclinazione della pala intorno al proprio asse radiale
    const m = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), 0.62)
    g.applyMatrix4(m)
    g.applyMatrix4(new THREE.Matrix4().makeRotationZ((i * Math.PI * 2) / n))
    pezzi.push(g)
  }
  const merged = mergeGeometries(pezzi, false)!
  pezzi.forEach((p) => p.dispose())
  geoCache.set(k, merged)
  return merged
}

export interface VentolaProps {
  size?: number
  asse?: 'x' | 'y' | 'z'
  pos: V3
  rgb: ImpostazioniRgb
  gruppo?: Bersaglio
  fase?: number
  conRgb?: boolean
  telaio?: string
  pale?: string
  velocita?: number
  ferma?: boolean
  tondo?: boolean
}

export function Ventola({ size = 1.2, asse = 'z', pos, rgb, gruppo = 'ventole', fase = 0, conRgb = false, telaio = '#17171b', pale = '#202026', velocita = 5, ferma = false, tondo = false }: VentolaProps) {
  const rotore = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (rotore.current && !ferma) rotore.current.rotation.z -= dt * velocita
  })
  const rot: V3 = asse === 'x' ? [0, Math.PI / 2, 0] : asse === 'y' ? [Math.PI / 2, 0, 0] : [0, 0, 0]
  const gTel = useMemo(() => geoTelaio(size), [size])
  const gPale = useMemo(() => geoPale(size), [size])
  return (
    <group position={pos} rotation={rot}>
      {tondo ? (
        <mesh position={[0, 0, 0]} castShadow>
          <torusGeometry args={[size * 0.49, 0.03, 12, 64]} />
          <meshStandardMaterial color={telaio} metalness={0.3} roughness={0.45} />
        </mesh>
      ) : (
        <mesh geometry={gTel} castShadow receiveShadow>
          <meshStandardMaterial color={telaio} metalness={0.15} roughness={0.55} />
        </mesh>
      )}
      {/* anello luminoso interno */}
      <mesh position={[0, 0, 0.115]}>
        <torusGeometry args={[size * 0.465, 0.014, 10, 56]} />
        {conRgb ? <RgbMat rgb={rgb} gruppo={gruppo} fase={fase} forza={1.1} /> : <meshStandardMaterial color="#1a1a1f" roughness={0.6} />}
      </mesh>
      <group ref={rotore}>
        <mesh geometry={gPale} castShadow>
          <meshStandardMaterial color={pale} roughness={0.42} metalness={0.05} side={THREE.DoubleSide} transparent={conRgb} opacity={conRgb ? 0.92 : 1} />
        </mesh>
        <Cil r={size * 0.14} h={0.2} rot={[Math.PI / 2, 0, 0]} color={telaio} metal={0.3} rough={0.4} />
        <mesh position={[0, 0, 0.101]}>
          <circleGeometry args={[size * 0.105, 32]} />
          {conRgb ? <RgbMat rgb={rgb} gruppo={gruppo} fase={fase + 0.1} forza={0.9} /> : <meshStandardMaterial color="#2a2a30" roughness={0.4} metalness={0.5} />}
        </mesh>
      </group>
      {/* quattro tamponi antivibrazione agli angoli */}
      {!tondo && [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => (
        <mesh key={i} position={[a * size * 0.42, b * size * 0.42, 0.122]}>
          <cylinderGeometry args={[0.035, 0.035, 0.012, 14]} />
          <meshStandardMaterial color="#0a0a0c" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

/* ================================================== rete di piccoli oggetti */

/** Istanze ripetute di una stessa geometria (condensatori, lamelle, viti). */
export function Istanze({ geo, color = '#222', metal = 0.5, rough = 0.5, matrici }: { geo: THREE.BufferGeometry; color?: string; metal?: number; rough?: number; matrici: THREE.Matrix4[] }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    matrici.forEach((mx, i) => m.setMatrixAt(i, mx))
    m.instanceMatrix.needsUpdate = true
  }, [matrici])
  return (
    <instancedMesh ref={ref} args={[geo, undefined, matrici.length]} castShadow receiveShadow>
      <meshStandardMaterial color={color} metalness={metal} roughness={rough} />
    </instancedMesh>
  )
}

export const mat = (x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(sx, sy, sz))

/** Pila di lamelle (alette di un dissipatore o radiatore), lungo l'asse indicato. */
export function Alette({ size, pos, n = 30, asse = 'z', color = '#aab0bb', metal = 0.9, rough = 0.35 }: { size: V3; pos: V3; n?: number; asse?: 'x' | 'y' | 'z'; color?: string; metal?: number; rough?: number }) {
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  const m = useMemo(() => {
    const out: THREE.Matrix4[] = []
    const i = asse === 'x' ? 0 : asse === 'y' ? 1 : 2
    const passo = size[i] / n
    for (let k = 0; k < n; k++) {
      const off = -size[i] / 2 + passo * (k + 0.5)
      const s: V3 = [size[0], size[1], size[2]]
      s[i] = passo * 0.55
      const p: V3 = [0, 0, 0]
      p[i] = off
      out.push(mat(p[0], p[1], p[2], s[0], s[1], s[2]))
    }
    return out
  }, [size, n, asse])
  return (
    <group position={pos}>
      <Istanze geo={geo} color={color} metal={metal} rough={rough} matrici={m} />
    </group>
  )
}

export { RoundedBox }
