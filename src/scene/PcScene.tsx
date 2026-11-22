import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import * as THREE from 'three'
import { ex } from '../data/hardware'
import { posizioneRadiatore, risolvi } from '../engine/compat'
import type { Risolta } from '../engine/compat'
import { qualitaEffettiva } from '../lib/qualita'
import { useStore } from '../store/useStore'
import type { VistaCamera } from '../store/useStore'
import type { Progetto } from '../types'
import { LuceRgb, Ventola } from './gfx'
import type { V3 } from './gfx'
import { ancore, geometria, slotVentole } from './layout'
import type { Ancore, Geo } from './layout'
import { Aio, Aria, Cavi, Copertura, Cpu, Gpu, Guscio, Psu, Ram, SchedaMadre, Ssd, eBianco } from './parts'
import { Cassa, Lampada, Monitor, Mouse, Scrivania, Tastiera } from './Scrivania'
import { cameraApi, sceneApi } from './sceneApi'

/* ---------------------------------------------------------- assemblaggio */

interface Parte {
  key: string
  esplosione: V3
  node: ReactNode
}

export function costruisciParti(p: Progetto, r: Risolta, g: Geo, vetro: boolean): Parte[] {
  const rgb = p.rgb
  const parti: Parte[] = []
  const add = (key: string, esplosione: V3, node: ReactNode) => parti.push({ key, esplosione, node })

  add(`case-${r.case?.id ?? 'vuoto'}`, [0, 0, 0], <Guscio g={g} c={r.case} vetro={vetro} />)
  add(`cop-${r.alimentatore?.id ?? ''}-${r.case?.id ?? ''}`, [-1.5, -1.8, 0.8], <Copertura g={g} c={r.case} />)
  if (r['scheda-madre']) add(`mb-${r['scheda-madre'].id}-${g.board.d}`, [0, 0, 1.2], <SchedaMadre g={g} c={r['scheda-madre']} />)
  if (r.cpu && r['scheda-madre']) add(`cpu-${r.cpu.id}`, [0, 0, r.dissipatore ? 2.2 : 3.2], <Cpu g={g} c={r.cpu} />)
  if (r.dissipatore && r['scheda-madre']) {
    const d = r.dissipatore
    add(`cool-${d.id}`, [0, 0.8, 5.2], d.formato === 'AIO' ? <Aio g={g} c={d} rgb={rgb} caseC={r.case} /> : <Aria g={g} c={d} rgb={rgb} />)
  }
  if (r.ram && r['scheda-madre']) add(`ram-${r.ram.id}`, [0, 1.1, 4.2], <Ram g={g} c={r.ram} mb={r['scheda-madre']} rgb={rgb} />)
  if (r.gpu && r['scheda-madre']) add(`gpu-${r.gpu.id}-${p.gpuVerticale}`, p.gpuVerticale ? [0, 0, 3.6] : [-0.6, -1.6, 4.2], <Gpu g={g} c={r.gpu} rgb={rgb} verticale={p.gpuVerticale} />)
  if (r['scheda-madre']) r.ssd.forEach((s) => add(`ssd-${s.id}`, [0, 0.6, 3.4], <Ssd g={g} c={s} indice={r.ssd.filter((x) => x.formato === s.formato).indexOf(s)} />))
  else r.ssd.forEach((s, i) => s.formato === 'SATA' && add(`ssd-${s.id}`, [0, 0, 2], <Ssd g={g} c={s} indice={i} />))
  if (r.alimentatore) add(`psu-${r.alimentatore.id}`, [2.4, -1.4, 0.4], <Psu g={g} c={r.alimentatore} />)
  if (r.alimentatore) add(`cavi-${r.alimentatore.id}-${r.cavi.map((c) => c.id).join()}-${r.gpu?.id ?? ''}-${p.gpuVerticale}-${!!r.cpu}-${!!r['scheda-madre']}`, [0, 0, 1.8], <Cavi g={g} r={r} rgb={rgb} verticale={p.gpuVerticale} />)

  // ventole: quelle del case, i set aggiuntivi e il radiatore AIO
  const sl = slotVentole(g, r.case)
  const aio = r.dissipatore?.formato === 'AIO' ? r.dissipatore : undefined
  const pos = aio ? posizioneRadiatore(r.case, Number(aio.formatoRadiatore)) : null
  const nAio = aio ? (Number(aio.formatoRadiatore) >= 360 ? 3 : 2) : 0
  const usaTop = !!aio && pos === 'superiore'
  const frontLib = sl.front.slice(aio && !usaTop ? nAio : 0)
  const topLib = sl.top.slice(aio && usaTop ? nAio : 0)
  const coda = [...sl.rear, ...frontLib, ...topLib]
  const queue: { set?: (typeof r.ventole)[number] }[] = []
  for (let i = 0; i < (r.case?.numeroVentole ?? 0); i++) queue.push({})
  r.ventole.forEach((s) => {
    for (let i = 0; i < (s.numeroVentole ?? 0); i++) queue.push({ set: s })
  })
  queue.slice(0, coda.length).forEach((q, i) => {
    const s = coda[i]
    const set = q.set
    const rgbOn = !!set && ex.b(set, 'rgb')
    const dim = set && ex.n(set, 'dimensione') === 140 ? 1.38 : 1.2
    const bianca = eBianco(set?.colore) || (!set && eBianco(r.case?.colore))
    const marrone = set?.colore === 'Marrone'
    add(
      `ven-${set?.id ?? 'case'}-${i}-${s.zona}`,
      s.zona === 'front' ? [-3.2, 0, 0] : s.zona === 'rear' ? [3, 0, 0] : [0, 3.2, 0],
      <Ventola size={dim} asse={s.asse} pos={[s.x, s.y, s.z]} rgb={rgb} fase={i * 0.18} conRgb={rgbOn} telaio={bianca ? '#d9dce2' : marrone ? '#8a6a45' : '#18181c'} pale={bianca ? '#cfd3da' : marrone ? '#e5d3b3' : '#202026'} />,
    )
  })
  return parti
}

function useFantasmi(parti: Parte[]): Parte[] {
  const prec = useRef<Map<string, Parte>>(new Map())
  const [fantasmi, setFantasmi] = useState<Parte[]>([])
  useEffect(() => {
    const att = new Map(parti.map((x) => [x.key, x]))
    const rimossi = [...prec.current.values()].filter((x) => !att.has(x.key))
    prec.current = att
    if (!rimossi.length) return
    const marcati = rimossi.map((x) => ({ ...x, key: `~${x.key}~${Math.random().toString(36).slice(2, 6)}` }))
    setFantasmi((f) => [...f, ...marcati])
    const t = setTimeout(() => setFantasmi((f) => f.filter((x) => !marcati.includes(x))), 500)
    return () => clearTimeout(t)
  }, [parti])
  return fantasmi
}

const outBack = (t: number) => {
  const c1 = 1.2
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function ParteAnimata({ parte, uscita, esploso }: { parte: Parte; uscita: boolean; esploso: boolean }) {
  const ref = useRef<THREE.Group>(null)
  const t = useRef(uscita ? 1 : 0)
  const e = useRef(0)
  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    t.current = uscita ? Math.max(0, t.current - dt * 3.2) : Math.min(1, t.current + dt * 1.9)
    e.current += ((esploso ? 1 : 0) - e.current) * Math.min(1, dt * 4.5)
    const ent = uscita ? t.current : outBack(t.current)
    const k = e.current + (1 - ent) * 0.28
    g.position.set(parte.esplosione[0] * k, parte.esplosione[1] * k, parte.esplosione[2] * k)
    g.visible = !(ent < 0.02 && !uscita)
  })
  return <group ref={ref}>{parte.node}</group>
}

/* ----------------------------------------------------------------- camera */

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

function posaVista(vista: VistaCamera, g: Geo, a: Ancore, esploso: boolean): { p: V3; t: V3 } {
  const f = Math.max(g.D, g.H) / 5
  const k = esploso ? 1.55 : 1
  const [cx, cy] = a.cpu
  switch (vista) {
    case 'frontale': return { p: [-(g.D * 1.5 + 3) * k, 0.4, g.W * 1.2 * k], t: [0, 0, 0] }
    case 'interno': return { p: [0.3, 0.2, (g.W / 2 + 6.6 * f) * k], t: [0, -0.1, 0] }
    case 'scheda-madre': return { p: [cx + 0.6, cy - 0.2, g.zSurf + 6.2], t: [cx - 0.3, cy - 0.5, g.zSurf] }
    case 'dissipatore': return { p: [cx - 2.7, cy + 0.6, g.zSurf + 3.6], t: [cx, cy, g.zSurf + 0.6] }
    case 'ram': return { p: [a.ram[0] - 1.2, a.ram[1] + 0.2, g.zSurf + 4.4], t: [a.ram[0], a.ram[1], g.zSurf + 0.4] }
    case 'gpu': return { p: [a.gpu[0] - 0.6, a.gpu[1] - 1.9, a.gpu[2] + 4.4], t: [a.gpu[0], a.gpu[1], a.gpu[2] - 0.2] }
    case 'ssd': return { p: [a.ssd[0] + 0.5, a.ssd[1] + 0.3, g.zSurf + 3.2], t: [a.ssd[0], a.ssd[1], g.zSurf] }
    case 'psu': return { p: [a.psu[0] - 2.0, a.psu[1] + 1.3, g.zSurf + 4.6], t: [a.psu[0] - 0.4, a.psu[1], a.psu[2]] }
    case 'ventole': return { p: [-g.D / 2 - 2.8 * k, a.ventole[1], 3.8 * k], t: [-g.D / 2 + 0.3, a.ventole[1] - 0.2, 0] }
    default: return { p: [5.6 * f * k, 2.5 * f * k, 10.4 * f * k], t: [0, -0.1, 0] }
  }
}

interface Trasf {
  desk: boolean
  rot: number
  off: V3
}

const aMondo = (v: V3, t: Trasf): V3 => {
  if (!t.desk) return v
  const c = Math.cos(t.rot)
  const s = Math.sin(t.rot)
  return [v[0] * c + v[2] * s + t.off[0], v[1] + t.off[1], -v[0] * s + v[2] * c + t.off[2]]
}

function CameraRig({ g, a, esploso, t }: { g: Geo; a: Ancore; esploso: boolean; t: Trasf }) {
  const { camera, controls } = useThree()
  const req = useStore((s) => s.vistaReq)
  const anim = useRef<{ t: number; fp: THREE.Vector3; ft: THREE.Vector3; tp: THREE.Vector3; tt: THREE.Vector3 } | null>(null)
  const ult = useRef({ g, a, esploso, t })
  ult.current = { g, a, esploso, t }
  const primo = useRef(true)

  useEffect(() => {
    cameraApi.zoom = (f: number) => {
      const c = controls as unknown as { target: THREE.Vector3; update: () => void } | null
      if (!c) return
      const dir = camera.position.clone().sub(c.target)
      const len = THREE.MathUtils.clamp(dir.length() * f, 2.2, 40)
      camera.position.copy(c.target).add(dir.normalize().multiplyScalar(len))
      c.update()
    }
  }, [camera, controls])

  const vaiA = (v: VistaCamera, esp: boolean, istantaneo = false) => {
    const { g: gg, a: aa, t: tt0 } = ult.current
    let pose = posaVista(v, gg, aa, esp)
    if (tt0.desk && v === 'reset') pose = { p: [4.5, 6.8, 16.5], t: [-1.2, 1.7, -1.0] }
    else pose = { p: aMondo(pose.p, tt0), t: aMondo(pose.t, tt0) }
    const c = controls as unknown as { target: THREE.Vector3; update: () => void } | null
    const tp = new THREE.Vector3(...pose.p)
    const tt = new THREE.Vector3(...pose.t)
    // schermi stretti (telefono): allontana la camera per far entrare tutto in larghezza
    const asp = (camera as THREE.PerspectiveCamera).aspect || 1
    if (asp < 1) tp.sub(tt).multiplyScalar(Math.min(2.2, 1 / Math.max(asp, 0.4))).add(tt)
    if (istantaneo || !c) {
      camera.position.copy(tp)
      if (c) {
        c.target.copy(tt)
        c.update()
      }
      return
    }
    anim.current = { t: 0, fp: camera.position.clone(), ft: c.target.clone(), tp, tt }
  }

  useEffect(() => {
    if (primo.current) {
      primo.current = false
      vaiA('reset', false, true)
      return
    }
    vaiA(req.vista, ult.current.esploso)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req.id])

  const prevEsp = useRef(esploso)
  useEffect(() => {
    if (prevEsp.current !== esploso) {
      prevEsp.current = esploso
      vaiA(useStore.getState().vistaCorrente, esploso)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esploso])

  const prevDesk = useRef(t.desk)
  useEffect(() => {
    if (prevDesk.current !== t.desk) {
      prevDesk.current = t.desk
      vaiA('reset', false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.desk])

  useFrame((_, dt) => {
    const an = anim.current
    const c = controls as unknown as { target: THREE.Vector3; update: () => void } | null
    if (!an || !c) return
    an.t = Math.min(1, an.t + dt / 0.95)
    const e = easeInOut(an.t)
    camera.position.lerpVectors(an.fp, an.tp, e)
    c.target.lerpVectors(an.ft, an.tt, e)
    c.update()
    if (an.t >= 1) anim.current = null
  })
  return null
}

function LimitaPan({ ampio }: { ampio: boolean }) {
  const controls = useThree((s) => s.controls) as unknown as { target: THREE.Vector3 } | null
  useFrame(() => {
    if (!controls) return
    const t = controls.target
    const [lx, ly, lz] = ampio ? [14, 7, 9] : [5, 4, 4]
    t.x = THREE.MathUtils.clamp(t.x, -lx, lx)
    t.y = THREE.MathUtils.clamp(t.y, ampio ? -1 : -3.5, ly)
    t.z = THREE.MathUtils.clamp(t.z, -lz, lz)
  })
  return null
}

/* ------------------------------------------------------------------ scena */

function Effetti({ qualita }: { qualita: string }) {
  if (qualita === 'bassa') return null
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {qualita === 'alta' ? <N8AO aoRadius={0.55} distanceFalloff={1} intensity={2.2} quality="medium" halfRes /> : <></>}
      <Bloom intensity={0.55} luminanceThreshold={1.1} luminanceSmoothing={0.2} mipmapBlur radius={0.7} />
      <SMAA />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette eskil={false} offset={0.25} darkness={0.55} />
    </EffectComposer>
  )
}

function Contenuto({ p }: { p: Progetto }) {
  const pref = useStore((s) => s.pref)
  const esploso = useStore((s) => s.esploso)
  const modo = useStore((s) => s.modoCamera)
  const r = useMemo(() => risolvi(p.sel), [p.sel])
  const g = useMemo(() => geometria(r), [r])
  const a = useMemo(() => ancore(g, r, p.gpuVerticale), [g, r, p.gpuVerticale])
  const parti = useMemo(() => costruisciParti(p, r, g, pref.vetro), [p.rgb, p.gpuVerticale, r, g, pref.vetro]) // eslint-disable-line react-hooks/exhaustive-deps
  const fantasmi = useFantasmi(parti)
  const rgb = p.rgb
  const qualita = qualitaEffettiva(pref)
  const desk = (pref.ambiente ?? 'studio') === 'scrivania'
  const base = -g.H / 2 - 0.14
  const t: Trasf = useMemo(() => ({ desk, rot: Math.PI / 2, off: [-5.4, -base, -2.6] }), [desk, base])

  return (
    <>
      <color attach="background" args={[desk ? '#14151a' : '#0b0b0e']} />
      <fog attach="fog" args={[desk ? '#14151a' : '#0b0b0e', 20, 55]} />
      <ambientLight intensity={desk ? 0.5 : 0.4} />
      <hemisphereLight args={['#b4c6e0', '#14141a', 0.55]} />
      <directionalLight position={[6, 12, 9]} intensity={2.4} castShadow={qualita !== 'bassa'} shadow-mapSize={qualita === 'alta' ? [2048, 2048] : [1024, 1024]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-bias={-0.0004} />
      <directionalLight position={[-9, 4, -6]} intensity={0.8} color="#7dd3fc" />
      <spotLight position={[0, 8, -10]} intensity={80} angle={0.7} penumbra={1} color="#22d3ee" />
      <Environment resolution={qualita === 'bassa' ? 128 : 256}>
        <Lightformer form="rect" intensity={2.4} position={[0, 7, 6]} scale={[16, 5, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.4} position={[-9, 2, 2]} rotation-y={Math.PI / 2} scale={[9, 6, 1]} color="#9bdcff" />
        <Lightformer form="rect" intensity={1.1} position={[9, 1, 3]} rotation-y={-Math.PI / 2} scale={[9, 6, 1]} color="#c7b8ff" />
        <Lightformer form="rect" intensity={1.6} position={[0, 3, -9]} scale={[14, 3, 1]} color="#ffffff" />
        <Lightformer form="ring" intensity={0.9} position={[0, 2, 8]} scale={5} color="#ffffff" />
      </Environment>

      {desk ? (
        <group>
          <Scrivania rgb={rgb} />
          <group position={[1.5, 0, -2.4]}>
            <Monitor />
          </group>
          <group position={[1.5, 0, 1.3]}>
            <Tastiera rgb={rgb} />
          </group>
          <group position={[5.9, 0, 1.5]}>
            <Mouse rgb={rgb} />
          </group>
          <group position={[-2.1, 0, -2.5]} rotation={[0, 0.25, 0]}>
            <Cassa />
          </group>
          <group position={[5.6, 0, -2.5]} rotation={[0, -0.25, 0]}>
            <Cassa />
          </group>
          <group position={[8.3, 0, -3.2]} rotation={[0, 0.4, 0]}>
            <Lampada />
          </group>
          <ContactShadows position={[0, 0.01, 0]} scale={26} opacity={0.55} blur={2.4} far={4} resolution={qualita === 'bassa' ? 256 : qualita === 'media' ? 512 : 1024} />
        </group>
      ) : (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, base - 0.01, 0]} receiveShadow>
            <circleGeometry args={[70, 72]} />
            <meshStandardMaterial color="#17181f" roughness={0.55} metalness={0.35} envMapIntensity={0.6} />
          </mesh>
          <ContactShadows position={[0, base + 0.005, 0]} scale={18} opacity={0.65} blur={2.6} far={3.5} resolution={qualita === 'bassa' ? 256 : qualita === 'media' ? 512 : 1024} />
        </>
      )}

      <group position={desk ? t.off : [0, 0, 0]} rotation={[0, desk ? t.rot : 0, 0]}>
        {parti.map((x) => (
          <ParteAnimata key={x.key} parte={x} uscita={false} esploso={esploso} />
        ))}
        {fantasmi.map((x) => (
          <ParteAnimata key={x.key} parte={x} uscita esploso={esploso} />
        ))}
        {r.ram && <LuceRgb rgb={rgb} gruppo="ram" pos={[a.ram[0], a.ram[1], g.zSurf + 1.0]} forza={0.7} />}
        {(r.ventole.length > 0 || r.dissipatore) && <LuceRgb rgb={rgb} gruppo="ventole" pos={[-g.D / 2 + 1.2, 0.5, 0.2]} forza={0.8} fase={0.3} />}
        {r.dissipatore && ex.b(r.dissipatore, 'rgb') && <LuceRgb rgb={rgb} gruppo="dissipatore" pos={[a.cpu[0], a.cpu[1], g.zSurf + 1.2]} forza={0.8} fase={0.5} />}
      </group>

      <CameraRig g={g} a={a} esploso={esploso} t={t} />
      <OrbitControls
        makeDefault
        mouseButtons={{ LEFT: modo === 'pan' ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
        touches={{ ONE: modo === 'pan' ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
        enableDamping
        dampingFactor={0.08}
        minDistance={2.2}
        maxDistance={desk ? 40 : 26}
        maxPolarAngle={Math.PI * 0.53}
        panSpeed={0.6}
        rotateSpeed={0.7}
        zoomSpeed={0.8}
        autoRotate={pref.autoRotazione}
        autoRotateSpeed={1.6}
        screenSpacePanning
      />
      <LimitaPan ampio={desk} />
      <Effetti qualita={qualita} />
    </>
  )
}

export default function PcScene({ progetto }: { progetto: Progetto }) {
  const pref = useStore((s) => s.pref)
  const qualita = qualitaEffettiva(pref)
  useEffect(
    () => () => {
      sceneApi.gl = null
    },
    [],
  )
  return (
    <Canvas
      key={qualita}
      shadows={qualita !== 'bassa'}
      dpr={qualita === 'bassa' ? [1, 1.25] : qualita === 'media' ? [1, 1.5] : [1, 2]}
      camera={{ fov: 36, near: 0.1, far: 140, position: [5, 3, 9] }}
      gl={{ antialias: qualita === 'bassa', preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        sceneApi.gl = gl
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
      }}
      aria-label="Anteprima 3D del tuo PC"
    >
      <Contenuto p={progetto} />
    </Canvas>
  )
}
