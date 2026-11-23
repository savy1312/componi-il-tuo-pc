import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { PRESET } from '../data/presets'
import { trova } from '../data/hardware'
import { risolvi } from '../engine/compat'
import { useQualita } from '../lib/qualita'
import { useStore } from '../store/useStore'
import type { Categoria, Componente, Progetto } from '../types'
import { geometria } from './layout'
import { catDaChiave } from './categorieParti'
import { Effetti, costruisciParti } from './PcScene'

/* --------------------------------------------------------- contenuti del tour */

export interface PassoTour {
  cat: Categoria
  titolo: string
  nome: string
  testo: string
}

const DESCRIZIONI: Record<string, { titolo: string; testo: string }> = {
  case: { titolo: 'Il case', testo: 'È la “scatola” del PC: protegge i componenti e fa circolare l’aria.' },
  'scheda-madre': { titolo: 'La scheda madre', testo: 'Collega tra loro tutti i componenti e li fa parlare.' },
  cpu: { titolo: 'Il processore', testo: 'È il cervello del PC: esegue programmi e giochi.' },
  dissipatore: { titolo: 'Il raffreddamento', testo: 'Tiene fresco il processore, così non rallenta.' },
  ram: { titolo: 'La memoria RAM', testo: 'Permette di aprire tante cose insieme senza rallentare.' },
  gpu: { titolo: 'La scheda video', testo: 'Disegna giochi, grafica e video in modo fluido.' },
  ssd: { titolo: 'L’archiviazione (SSD)', testo: 'Qui vivono Windows, i giochi e i tuoi file.' },
  alimentatore: { titolo: 'L’alimentatore', testo: 'Dà energia a tutto il PC in modo stabile.' },
  ventole: { titolo: 'Le ventole', testo: 'Spingono aria fresca dentro e portano via il calore.' },
  cavi: { titolo: 'I cavi', testo: 'Portano corrente e dati ai componenti, in modo ordinato.' },
}

export type FaseHero = 'assembla' | 'smonta' | 'tour' | 'rimonta' | 'gira' | 'fine'

export interface StatoHero {
  fase: FaseHero
  passo: number
  totale: number
  info?: PassoTour
}

/* ----------------------------------------------------------------- tempistica */

const T_ASSEMBLA = 2.4
const T_PAUSA = 0.7
const T_SMONTA = 1.4
const T_PASSO = 1.6
const T_RIMONTA = 1.5
const T_GIRA = 2.9
const GIRI = 5
const ANGOLO_FINALE = 0.62
const SCALA_ESP = 0.95

/** Avvicina l'angolo al valore voluto passando dal lato più corto. */
const verso = (ang: number, target: number, k: number) => {
  const d = ((((target - ang + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI
  return ang + d * Math.min(1, k)
}
const outCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const outBack = (t: number) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2)

interface Cond {
  esp: number
  ang: number
  stato: StatoHero
}

function Parte({ esplosione, cat, focus, cond, children }: { esplosione: [number, number, number]; cat: Categoria | null; focus: Categoria | null; cond: React.MutableRefObject<Cond>; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  const evid = useRef(0)
  const attivo = !!cat && cat === focus
  // durante la presentazione degli altri pezzi il case si nasconde, così si vede cosa c'è dentro
  const nascosto = cat === 'case' && !!focus && focus !== 'case'
  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    const k = cond.current.esp * SCALA_ESP
    evid.current += ((attivo ? 1 : 0) - evid.current) * Math.min(1, dt * 8)
    g.position.set(esplosione[0] * k, esplosione[1] * k, esplosione[2] * k + evid.current * 0.9)
    g.scale.setScalar(1 + evid.current * 0.045)
  })
  // bagliore ciano sul componente che si sta presentando
  useEffect(() => {
    const g = ref.current
    if (!g) return
    const salvati: { m: THREE.MeshStandardMaterial; c: THREE.Color; i: number }[] = []
    if (attivo) {
      g.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
        if (!m || Array.isArray(m) || !('emissive' in m) || m.emissiveMap || m.transparent || ((m as THREE.MeshPhysicalMaterial).transmission ?? 0) > 0) return
        salvati.push({ m, c: m.emissive.clone(), i: m.emissiveIntensity })
        m.emissive.set('#22d3ee')
        m.emissiveIntensity = 0.32
      })
    }
    return () => {
      salvati.forEach(({ m, c, i }) => {
        m.emissive.copy(c)
        m.emissiveIntensity = i
      })
    }
  }, [attivo])
  return (
    <group ref={ref} visible={!nascosto}>
      {children}
    </group>
  )
}

/* ---------------------------------------------------------------- la scena */

function Scena({ passi, onStato, ridotto, qualita }: { passi: PassoTour[]; onStato: (s: StatoHero) => void; ridotto: boolean; qualita: 'media' | 'bassa' }) {
  const { camera, size, invalidate } = useThree()
  const cond = useRef<Cond>({ esp: ridotto ? 0 : 1.6, ang: ridotto ? ANGOLO_FINALE : 0, stato: { fase: ridotto ? 'fine' : 'assembla', passo: 0, totale: passi.length } })
  const t0 = useRef(0)
  const angGira0 = useRef(0)
  const [focus, setFocus] = useState<Categoria | null>(null)
  const ultimo = useRef('')

  const { parti, g } = useMemo(() => {
    const preset = PRESET.find((x) => x.id === 'gaming-4k-ultra') ?? PRESET[0]
    const cavo = trova('corsair-kit-cavi-sleeved-type-5-gen-5-nero-nero')
    const sel = { ...preset.sel, cavi: cavo ? [cavo.id] : preset.sel.cavi }
    const p: Progetto = { id: 'hero', nome: preset.nome, creato: '', aggiornato: '', salvato: true, sel, rgb: preset.rgb, gpuVerticale: !!preset.gpuVerticale }
    const r = risolvi(sel)
    const geo = geometria(r)
    return { parti: costruisciParti(p, r, geo, true), g: geo }
  }, [])

  const ombra = useMemo(() => {
    const cv = document.createElement('canvas')
    cv.width = cv.height = 128
    const cx = cv.getContext('2d')!
    const gr = cx.createRadialGradient(64, 64, 4, 64, 64, 64)
    gr.addColorStop(0, 'rgba(0,0,0,0.75)')
    gr.addColorStop(1, 'rgba(0,0,0,0)')
    cx.fillStyle = gr
    cx.fillRect(0, 0, 128, 128)
    const t = new THREE.CanvasTexture(cv)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  const gruppo = useRef<THREE.Group>(null)
  const base = -g.H / 2 - 0.14
  const durTour = passi.length * T_PASSO
  const tFine = T_ASSEMBLA + T_PAUSA + T_SMONTA + durTour + T_RIMONTA + T_GIRA

  const pubblica = (s: StatoHero) => {
    const chiave = `${s.fase}-${s.passo}`
    if (chiave === ultimo.current) return
    ultimo.current = chiave
    cond.current.stato = s
    setFocus(s.fase === 'tour' ? passi[s.passo]?.cat ?? null : null)
    onStato(s)
  }

  useEffect(() => {
    pubblica(cond.current.stato)
    if (ridotto) {
      // movimento ridotto: PC montato e fermo fin dall'inizio
      if (gruppo.current) gruppo.current.rotation.y = ANGOLO_FINALE
      const asp = size.width / Math.max(1, size.height)
      camera.position.set(0, 2.3, 10.6 * (asp < 1 ? Math.min(1.9, 1 / Math.max(asp, 0.5)) : 1))
      camera.lookAt(0, -0.1, 0)
      invalidate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame((_, dt) => {
    const c = cond.current
    if (c.stato.fase === 'fine') return
    t0.current += Math.min(dt, 0.25)
    const t = t0.current
    const tot = passi.length
    let fase: FaseHero = 'assembla'
    let passo = 0

    const a1 = T_ASSEMBLA
    const a2 = a1 + T_PAUSA
    const a3 = a2 + T_SMONTA
    const a4 = a3 + durTour
    const a5 = a4 + T_RIMONTA
    const a6 = a5 + T_GIRA

    if (t < a1) {
      fase = 'assembla'
      c.esp = 1.6 * (1 - outBack(Math.min(1, t / a1)))
      c.ang += dt * 0.55
    } else if (t < a2) {
      fase = 'assembla'
      c.esp = 0
      c.ang += dt * 0.55
    } else if (t < a3) {
      fase = 'smonta'
      c.esp = inOut((t - a2) / T_SMONTA)
      c.ang = verso(c.ang, 0.9, dt * 2.2)
    } else if (t < a4) {
      fase = 'tour'
      passo = Math.min(tot - 1, Math.floor((t - a3) / T_PASSO))
      c.esp = 1
      c.ang = verso(c.ang, 0.9 + 0.28 * Math.sin((t - a3) * 0.9), dt * 3)
    } else if (t < a5) {
      fase = 'rimonta'
      c.esp = 1 - inOut((t - a4) / T_RIMONTA)
      c.ang += dt * 0.9
      angGira0.current = c.ang
    } else if (t < a6) {
      fase = 'gira'
      c.esp = 0
      const u = (t - a5) / T_GIRA
      const a0 = angGira0.current
      const resto = (((ANGOLO_FINALE - a0) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
      c.ang = a0 + (Math.PI * 2 * GIRI + resto) * outCubic(u)
    } else {
      fase = 'fine'
      c.esp = 0
      c.ang = ANGOLO_FINALE
    }

    if (fase === 'rimonta' || fase === 'gira') angGira0.current = fase === 'rimonta' ? c.ang : angGira0.current
    pubblica({ fase, passo, totale: tot, info: fase === 'tour' ? passi[passo] : undefined })

    if (gruppo.current) gruppo.current.rotation.y = c.ang

    // camera: si avvicina quando il PC è montato, si allontana quando è smontato; su schermi stretti arretra
    const asp = size.width / Math.max(1, size.height)
    const stretto = asp < 1 ? Math.min(1.9, 1 / Math.max(asp, 0.5)) : 1
    const d = (10.6 + 9.4 * c.esp) * stretto
    camera.position.set(0.3 * c.esp, 2.3 + 0.9 * c.esp, d)
    camera.lookAt(0.2 * c.esp, -0.1 + 0.9 * c.esp, 0)
    if (fase === 'fine') invalidate()
  })

  return (
    <>
      <ambientLight intensity={0.5} />
      <hemisphereLight args={['#b4c6ff', '#10183a', 0.7]} />
      <directionalLight position={[6, 10, 8]} intensity={2.4} />
      <directionalLight position={[-9, 4, -6]} intensity={1.0} color="#7dd3fc" />
      <spotLight position={[0, 9, -10]} intensity={90} angle={0.7} penumbra={1} color="#818cf8" />
      <Environment resolution={qualita === 'bassa' ? 128 : 256}>
        <Lightformer form="rect" intensity={2.4} position={[0, 7, 6]} scale={[16, 5, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.4} position={[-9, 2, 2]} rotation-y={Math.PI / 2} scale={[9, 6, 1]} color="#9bdcff" />
        <Lightformer form="rect" intensity={1.2} position={[9, 1, 3]} rotation-y={-Math.PI / 2} scale={[9, 6, 1]} color="#c7b8ff" />
        <Lightformer form="rect" intensity={1.6} position={[0, 3, -9]} scale={[14, 3, 1]} color="#ffffff" />
      </Environment>

      {/* piattaforma luminosa */}
      <group position={[0, base, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[5.2, 72]} />
          <meshStandardMaterial color="#0b1738" roughness={0.4} metalness={0.6} transparent opacity={0.85} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[5.05, 5.2, 96]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.7} toneMapped={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[3.7, 3.74, 96]} />
          <meshBasicMaterial color="#818cf8" transparent opacity={0.5} toneMapped={false} />
        </mesh>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, base + 0.02, 0]}>
        <planeGeometry args={[9, 9]} />
        <meshBasicMaterial map={ombra} transparent depthWrite={false} toneMapped={false} />
      </mesh>

      <group ref={gruppo}>
        {parti.map((x) => (
          <Parte key={x.key} esplosione={x.esplosione} cat={catDaChiave(x.key)} focus={focus} cond={cond}>
            {x.node}
          </Parte>
        ))}
      </group>
      <Effetti qualita={qualita} />
    </>
  )
}

/* ------------------------------------------------------------------ export */

export default function HeroPc({ onStato }: { onStato: (s: StatoHero) => void }) {
  const pref = useStore((s) => s.pref)
  // sullo sfondo della Home non servono gli effetti più pesanti: al massimo «media»
  const q = useQualita(pref)
  const qualita: 'media' | 'bassa' = q === 'bassa' ? 'bassa' : 'media'
  const ridotto = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [fermo, setFermo] = useState(false)

  const passi: PassoTour[] = useMemo(() => {
    const preset = PRESET.find((x) => x.id === 'gaming-4k-ultra') ?? PRESET[0]
    const cavo = trova('corsair-kit-cavi-sleeved-type-5-gen-5-nero-nero')
    const r = risolvi({ ...preset.sel, cavi: cavo ? [cavo.id] : preset.sel.cavi })
    const elenco: [Categoria, Componente | undefined][] = [
      ['case', r.case],
      ['scheda-madre', r['scheda-madre']],
      ['cpu', r.cpu],
      ['dissipatore', r.dissipatore],
      ['ram', r.ram],
      ['gpu', r.gpu],
      ['ssd', r.ssd[0]],
      ['alimentatore', r.alimentatore],
      ['ventole', r.ventole[0]],
      ['cavi', r.cavi[0]],
    ]
    return elenco.filter((x): x is [Categoria, Componente] => !!x[1]).map(([cat, c]) => ({ cat, titolo: DESCRIZIONI[cat].titolo, nome: c.nome, testo: DESCRIZIONI[cat].testo }))
  }, [])

  return (
    <Canvas
      frameloop={fermo ? 'demand' : 'always'}
      dpr={qualita === 'bassa' ? [1, 1.5] : [1, 2]}
      camera={{ fov: 32, near: 0.1, far: 120, position: [0, 3, 12] }}
      gl={{ antialias: qualita === 'bassa', alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
        gl.setClearColor(0x000000, 0)
      }}
      aria-label="Un PC in 3D che si smonta e si rimonta mostrando ogni componente"
    >
      <Scena
        passi={passi}
        ridotto={ridotto}
        qualita={qualita}
        onStato={(s) => {
          onStato(s)
          if (s.fase === 'fine') setTimeout(() => setFermo(true), 400)
        }}
      />
    </Canvas>
  )
}
