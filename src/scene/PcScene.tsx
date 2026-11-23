import { Canvas, useFrame, useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, MeshReflectorMaterial, OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import * as THREE from 'three'
import { ex } from '../data/hardware'
import { posizioneRadiatore, risolvi } from '../engine/compat'
import type { Risolta } from '../engine/compat'
import { PROFILI, useQualita } from '../lib/qualita'
import type { Livello } from '../lib/qualita'
import { useAnalisi } from '../lib/hooks'
import { useStore } from '../store/useStore'
import type { Evidenziazione, VistaCamera } from '../store/useStore'
import type { Categoria, Progetto } from '../types'
import { LuceRgb, Ventola, impostaAnisotropia } from './gfx'
import type { V3 } from './gfx'
import { ancore, geometria, slotVentole } from './layout'
import type { Ancore, Geo } from './layout'
import { Aio, Aria, Cavi, Copertura, Cpu, Gpu, Guscio, Psu, Ram, SchedaMadre, Ssd, eBianco } from './parts'
import { Lampada, Mouse, Scrivania, Tastiera } from './Scrivania'
import { CassaPro, CaviPostazione, Cuffie, Microfono, MonitorPro, Multipresa, Router, Webcam } from './Periferiche'
import type { DatiSchermo } from './schermo'
import { catDaChiave } from './categorieParti'
import { impostaHover, useHover } from './interazione'
import { MisuraPrestazioni } from './prestazioni'
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

export interface InfoCat {
  stato?: string
  tag: string[]
  fascia?: string
}

/** Colore e intensità con cui una categoria viene evidenziata (null = nessun alone). */
function calcolaTinta(cat: Categoria | null, hover: Categoria | null, sel: Categoria | null, modo: Evidenziazione, info?: InfoCat): { c: string; i: number } | null {
  if (!cat) return null
  if (sel === cat) return { c: '#22d3ee', i: 0.38 }
  if (hover === cat) return { c: '#67e8f9', i: 0.22 }
  if (!info) return null
  const ha = (t: string) => info.tag.includes(t)
  switch (modo) {
    case 'compatibilita':
      if (info.stato === 'Incompatibile') return { c: '#f43f5e', i: 0.6 }
      if (info.stato === 'Da verificare') return { c: '#f59e0b', i: 0.5 }
      return { c: '#10b981', i: 0.22 }
    case 'consigliato':
      return ha('Consigliato') ? { c: '#818cf8', i: 0.5 } : null
    case 'premium':
      return ha('Premium') || info.fascia === 'Enthusiast' ? { c: '#c084fc', i: 0.5 } : null
    case 'budget':
      return ha('Best Value') || info.fascia === 'Entry Level' ? { c: '#34d399', i: 0.45 } : null
    case 'silenzioso':
      return ha('Silenzioso') ? { c: '#2dd4bf', i: 0.45 } : null
    case 'rgb':
      return ha('RGB') || ha('ARGB') ? { c: '#ec4899', i: 0.5 } : null
    default:
      return null
  }
}

function ParteAnimata({ parte, uscita, esploso, infoCat }: { parte: Parte; uscita: boolean; esploso: boolean; infoCat?: Partial<Record<Categoria, InfoCat>> }) {
  const ref = useRef<THREE.Group>(null)
  const t = useRef(uscita ? 1 : 0)
  const e = useRef(0)
  const cat = useMemo(() => catDaChiave(parte.key), [parte.key])
  const hover = useHover()
  const sel = useStore((s) => s.selezionato)
  const modo = useStore((s) => s.evidenzia)
  const vista = useStore((s) => s.modoVista)
  const tinta = calcolaTinta(cat, hover.cat, sel, modo, cat ? infoCat?.[cat] : undefined)
  const nascosto = vista === 'componenti' && cat === 'case'
  const nascRef = useRef(nascosto)
  nascRef.current = nascosto

  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    t.current = uscita ? Math.max(0, t.current - dt * 3.2) : Math.min(1, t.current + dt * 1.9)
    e.current += ((esploso ? 1 : 0) - e.current) * Math.min(1, dt * 4.5)
    const ent = uscita ? t.current : outBack(t.current)
    const k = e.current + (1 - ent) * 0.28
    g.position.set(parte.esplosione[0] * k, parte.esplosione[1] * k, parte.esplosione[2] * k)
    g.visible = !(ent < 0.02 && !uscita) && !nascRef.current
  })

  // alone colorato (hover, selezione, evidenziazione): si accende l'emissione dei materiali opachi
  const chiave = tinta ? `${tinta.c}|${tinta.i}` : ''
  useEffect(() => {
    const g = ref.current
    if (!g || !tinta) return
    const salvati: { m: THREE.MeshStandardMaterial; c: THREE.Color; i: number }[] = []
    g.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
      if (!m || Array.isArray(m) || !('emissive' in m) || m.emissiveMap || m.transparent || ((m as THREE.MeshPhysicalMaterial).transmission ?? 0) > 0) return
      salvati.push({ m, c: m.emissive.clone(), i: m.emissiveIntensity })
      m.emissive.set(tinta.c)
      m.emissiveIntensity = Math.max(m.emissiveIntensity, 0) + tinta.i
    })
    return () => salvati.forEach(({ m, c, i }) => {
      m.emissive.copy(c)
      m.emissiveIntensity = i
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chiave, parte.node])

  // vista wireframe
  useEffect(() => {
    const g = ref.current
    if (!g || vista !== 'wireframe') return
    const toccati: THREE.Material[] = []
    g.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined
      if (!m) return
      ;(Array.isArray(m) ? m : [m]).forEach((x) => {
        const w = x as THREE.MeshStandardMaterial
        if ('wireframe' in w && !w.wireframe) {
          w.wireframe = true
          toccati.push(w)
        }
      })
    })
    return () => toccati.forEach((x) => ((x as THREE.MeshStandardMaterial).wireframe = false))
  }, [vista, parte.node])

  return (
    <group ref={ref} userData={{ cat }}>
      {parte.node}
    </group>
  )
}

/* ----------------------------------------------------------------- camera */

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

function posaVista(vista: VistaCamera, g: Geo, a: Ancore, esploso: boolean): { p: V3; t: V3 } {
  const f = Math.max(g.D, g.H) / 5
  const k = esploso ? 1.55 : 1
  const [cx, cy] = a.cpu
  switch (vista) {
    case 'frontale': return { p: [-(g.D * 1.5 + 3) * k, 0.4, g.W * 1.2 * k], t: [0, 0, 0] }
    case 'laterale': return { p: [-0.4, 0.5, (g.W / 2 + 9.5 * f) * k], t: [0, -0.1, 0] }
    case 'posteriore': return { p: [(g.D / 2 + 9 * f) * k, 1.2 * f, 2.2 * f * k], t: [0, -0.2, 0] }
    case 'alto': return { p: [0.3, (g.H / 2 + 10 * f) * k, 0.8], t: [0, -0.3, 0] }
    case 'cablaggio': return { p: [a.psu[0] + 0.2, a.psu[1] + 1.2, g.zSurf + 4.6], t: [a.psu[0] - 0.8, a.psu[1] + 0.6, a.psu[2]] }
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
    if (tt0.desk && v === 'reset') pose = { p: [3.0, 8.6, 22.5], t: [-0.4, 0.9, -1.0] }
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

export function Effetti({ qualita }: { qualita: Livello }) {
  const P = PROFILI[qualita]
  if (!P.post) return null
  return (
    <EffectComposer multisampling={P.msaa} enableNormalPass={false}>
      {P.ao ? <N8AO aoRadius={P.ao === 'ultra' ? 0.7 : 0.55} distanceFalloff={1} intensity={P.ao === 'medium' ? 2.2 : 2.8} quality={P.ao} halfRes={P.aoMezza} /> : <></>}
      <Bloom intensity={P.bloom} luminanceThreshold={1.1} luminanceSmoothing={0.2} mipmapBlur radius={0.7} />
      {P.smaa ? <SMAA /> : <></>}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette eskil={false} offset={0.25} darkness={0.55} />
    </EffectComposer>
  )
}

/** Categoria colpita dal raggio: i componenti interni hanno la precedenza sul case (il vetro è trasparente). */
function catDaEvento(e: ThreeEvent<PointerEvent> | ThreeEvent<MouseEvent>): Categoria | null {
  let caso: Categoria | null = null
  for (const h of e.intersections) {
    let o: THREE.Object3D | null = h.object
    while (o) {
      const c = o.userData?.cat as Categoria | null | undefined
      if (c) {
        if (c !== 'case') return c
        caso = 'case'
        break
      }
      o = o.parent
    }
  }
  return caso
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
  const qualita = useQualita(pref)
  const P = PROFILI[qualita]
  const modoVista = useStore((s) => s.modoVista)
  const setSelezionato = useStore((s) => s.setSelezionato)
  const setCategoria = useStore((s) => s.setCategoria)
  const analisi = useAnalisi()
  const infoCat = useMemo(() => {
    const comp: Partial<Record<Categoria, (typeof r)['case']>> = { case: r.case, 'scheda-madre': r['scheda-madre'], cpu: r.cpu, dissipatore: r.dissipatore, ram: r.ram, gpu: r.gpu, ssd: r.ssd[0], alimentatore: r.alimentatore, ventole: r.ventole[0], cavi: r.cavi[0] }
    const out: Partial<Record<Categoria, InfoCat>> = {}
    ;(Object.keys(comp) as Categoria[]).forEach((c) => {
      const x = comp[c]
      if (x) out[c] = { stato: analisi?.statiCategoria[c], tag: x.tag, fascia: x.fascia }
    })
    return out
  }, [r, analisi])
  const tocco = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches, [])
  const desk = (pref.ambiente ?? 'studio') === 'scrivania' && modoVista !== 'solo-pc'
  const base = -g.H / 2 - 0.14
  const t: Trasf = useMemo(() => ({ desk, rot: Math.PI / 2, off: [-5.4, -base, -2.6] }), [desk, base])

  const sfondoPers = pref.sfondoSchermo
  const datiSchermo: DatiSchermo = useMemo(
    () => ({
      modo: pref.schermo ?? 'monitoraggio',
      sfondo: sfondoPers,
      nome: p.nome,
      cpu: r.cpu?.nome,
      gpu: r.gpu?.nome,
      ram: r.ram ? `${r.ram.capacita ?? ''} ${r.ram.tipoRam ?? ''}`.trim() : undefined,
      ssd: r.ssd[0] ? `${r.ssd[0].nome}` : undefined,
      prezzo: new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(analisi?.prezzo ?? 0),
      carico: analisi?.tel.carico ?? 0,
      accenti: [/^#[0-9a-f]{6}$/i.test(p.rgb.colore) ? p.rgb.colore : '#22d3ee', '#818cf8'],
    }),
    [pref.schermo, sfondoPers, p.nome, p.rgb, r, analisi],
  )
  const coloreCavi = useMemo(() => ex.s(r.cavi[0], 'hex') || '#17181c', [r])
  // porte sul retro del PC, nelle coordinate della scena (solo in modalità scrivania)
  const puntiPc = useMemo(() => {
    const D = g.D / 2
    return {
      gpu: aMondo([D, a.gpu[1] - 0.3, a.gpu[2]], t),
      psu: aMondo([D, a.psu[1], a.psu[2]], t),
      io: aMondo([D, a.cpu[1] + 0.4, g.zSurf + 0.4], t),
    }
  }, [g, a, t])

  return (
    <>
      <color attach="background" args={[desk ? '#0b1430' : '#060c20']} />
      <fog attach="fog" args={[desk ? '#0b1430' : '#060c20', 20, 55]} />
      <ambientLight intensity={desk ? 0.5 : 0.4} />
      <hemisphereLight args={['#b4c6e0', '#14141a', 0.55]} />
      <directionalLight position={[6, 12, 9]} intensity={2.4} castShadow={P.ombre > 0} shadow-mapSize={[P.ombre || 512, P.ombre || 512]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-bias={-0.0004} />
      {P.luci >= 3 && <directionalLight position={[-9, 4, -6]} intensity={0.8} color="#7dd3fc" />}
      {P.luci >= 4 && <spotLight position={[0, 8, -10]} intensity={80} angle={0.7} penumbra={1} color="#22d3ee" />}
      {P.luci >= 5 && <pointLight position={[-6, 3, 7]} intensity={26} distance={22} color="#ffffff" />}
      <Environment resolution={P.ambiente}>
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
            <MonitorPro dati={datiSchermo} />
          </group>
          <group position={[1.5, 3.62, -2.42]}>
            <Webcam />
          </group>
          <group position={[1.5, 0, 1.3]}>
            <Tastiera rgb={rgb} />
          </group>
          <group position={[5.9, 0, 1.5]}>
            <Mouse rgb={rgb} />
          </group>
          <group position={[-2.1, 0, -2.5]} rotation={[0, 0.25, 0]}>
            <CassaPro lato={1} />
          </group>
          <group position={[5.6, 0, -2.5]} rotation={[0, -0.25, 0]}>
            <CassaPro lato={-1} />
          </group>
          <group position={[9.2, 0, 1.2]} rotation={[0, -0.5, 0]}>
            <Cuffie rgb={rgb} />
          </group>
          <group position={[-1.3, 0, 0.9]} rotation={[0, 0.5, 0]}>
            <Microfono />
          </group>
          <group position={[8.3, 0, -3.2]} rotation={[0, 0.4, 0]}>
            <Lampada />
          </group>
          <group position={[-9.0, 0, -3.2]} rotation={[0, 0.3, 0]}>
            <Router />
          </group>
          <group position={[-9.8, 0, -5.0]}>
            <Multipresa />
          </group>
          <CaviPostazione pc={puntiPc} colore={coloreCavi} />
          <ContactShadows position={[0, 0.01, 0]} scale={26} opacity={0.55} blur={2.4} far={4} resolution={P.ombraContatto} />
        </group>
      ) : (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, base - 0.01, 0]} receiveShadow>
            <circleGeometry args={[70, 72]} />
            {P.pavimentoRiflette ? (
              <MeshReflectorMaterial color="#0e1a3c" roughness={0.55} metalness={0.5} blur={[420, 90]} mixBlur={1} mixStrength={1.6} mixContrast={1.1} resolution={qualita === '4k' ? 1024 : 512} mirror={0.6} depthScale={0.4} minDepthThreshold={0.6} maxDepthThreshold={1.4} />
            ) : (
              <meshStandardMaterial color="#101c42" roughness={0.55} metalness={0.35} envMapIntensity={0.6} />
            )}
          </mesh>
          <ContactShadows position={[0, base + 0.005, 0]} scale={18} opacity={0.65} blur={2.6} far={3.5} resolution={P.ombraContatto} />
        </>
      )}

      <group
        position={desk ? t.off : [0, 0, 0]}
        rotation={[0, desk ? t.rot : 0, 0]}
        onPointerMove={(e) => {
          if (tocco) return
          const c = catDaEvento(e)
          impostaHover({ cat: c, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY })
          document.body.style.cursor = c ? 'pointer' : ''
        }}
        onPointerOut={() => {
          impostaHover({ cat: null, x: 0, y: 0 })
          document.body.style.cursor = ''
        }}
        onClick={(e) => {
          if (e.delta > 4) return
          const c = catDaEvento(e)
          if (!c) return
          setSelezionato(c)
          setCategoria(c)
        }}
      >
        {parti.map((x) => (
          <ParteAnimata key={x.key} parte={x} uscita={false} esploso={esploso} infoCat={infoCat} />
        ))}
        {fantasmi.map((x) => (
          <ParteAnimata key={x.key} parte={x} uscita esploso={esploso} infoCat={infoCat} />
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
      <MisuraPrestazioni />
      <Effetti qualita={qualita} />
    </>
  )
}

export default function PcScene({ progetto }: { progetto: Progetto }) {
  const pref = useStore((s) => s.pref)
  const qualita = useQualita(pref)
  const P = PROFILI[qualita]
  impostaAnisotropia(P.anisotropia)
  useEffect(
    () => () => {
      sceneApi.gl = null
    },
    [],
  )
  return (
    <Canvas
      key={qualita}
      shadows={P.ombre > 0}
      dpr={[P.dprMin, P.dprMax]}
      camera={{ fov: 36, near: 0.1, far: 140, position: [5, 3, 9] }}
      gl={{ antialias: !P.post, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        sceneApi.gl = gl
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
      }}
      onPointerMissed={() => useStore.getState().setSelezionato(null)}
      aria-label="Anteprima 3D del tuo PC"
    >
      <Contenuto p={progetto} />
    </Canvas>
  )
}
