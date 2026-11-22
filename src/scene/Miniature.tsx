import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RGB_DEFAULT } from '../data/palettes'
import { ex, per } from '../data/hardware'
import { risolvi } from '../engine/compat'
import type { Componente } from '../types'
import { Ventola } from './gfx'
import type { V3 } from './gfx'
import { ImmagineCavo } from './immaginiCavi'
import { geometria } from './layout'
import { Aio, Aria, Cpu, Gpu, Guscio, Psu, Ram, SchedaMadre, Ssd } from './parts'
import { selezioneVuota } from '../engine/compat'
import { cache, coda, inCoda, iscrivi, avvisa } from './miniatureStore'

/* -------------------------------------------------------------- scena demo */

interface Demo {
  node: ReactNode
  dir: V3
}

function creaDemo(c: Componente): Demo {
  const caseDemo = per('case')[0]
  const r = risolvi({ ...selezioneVuota(), case: c.categoria === 'case' ? c.id : caseDemo?.id })
  const g = geometria(r)
  const rgb = RGB_DEFAULT
  switch (c.categoria) {
    case 'case':
      return { node: <Guscio g={g} c={c} vetro />, dir: [-1, 0.42, 0.95] }
    case 'scheda-madre': {
      const gm = geometria(risolvi({ ...selezioneVuota(), case: caseDemo?.id, 'scheda-madre': c.id }))
      return { node: <SchedaMadre g={gm} c={c} />, dir: [-0.18, 0.25, 1] }
    }
    case 'cpu':
      return { node: <Cpu g={g} c={c} />, dir: [-0.35, 0.5, 1] }
    case 'gpu':
      return { node: <Gpu g={g} c={c} rgb={rgb} verticale={false} pos={[0, 0, 0]} />, dir: [-0.15, 0.55, 1] }
    case 'ram': {
      const mb = per('scheda-madre').find((m) => m.tipoRam === c.tipoRam) ?? per('scheda-madre')[0]
      return { node: <Ram g={g} c={c} mb={mb} rgb={rgb} />, dir: [-0.25, 0.3, 1] }
    }
    case 'dissipatore':
      return { node: c.formato === 'AIO' ? <Aio g={g} c={c} rgb={rgb} /> : <Aria g={g} c={c} rgb={rgb} />, dir: [-0.8, 0.45, 1] }
    case 'ssd':
      return { node: <Ssd g={g} c={c} indice={0} pos={[0, 0, 0]} />, dir: [-0.1, 0.25, 1] }
    case 'alimentatore':
      return { node: <Psu g={g} c={c} pos={[0, 0, 0]} />, dir: [-0.9, 0.55, 0.8] }
    case 'ventole': {
      const n = Math.min(3, Math.max(1, ex.n(c, 'numeroVentole', c.numeroVentole ?? 1)))
      const dim = ex.n(c, 'dimensione') === 140 ? 1.38 : 1.2
      const bianca = c.colore === 'Bianco'
      return {
        node: (
          <group>
            {Array.from({ length: n }, (_, i) => (
              <Ventola key={i} size={dim} asse="x" pos={[0, (i - (n - 1) / 2) * (dim + 0.05), 0]} rgb={rgb} fase={i * 0.2} conRgb={ex.b(c, 'rgb')} ferma telaio={bianca ? '#d9dce2' : '#18181c'} pale={bianca ? '#cfd3da' : '#202026'} />
            ))}
          </group>
        ),
        dir: [-1, 0.25, 0.5],
      }
    }
    default:
      return { node: <ImmagineCavo c={c} />, dir: [-0.15, 0.5, 1] }
  }
}

/* ------------------------------------------------------------- generatore */

const L = 400
const A = 300

function Lavoro({ c, fine }: { c: Componente; fine: (id: string, url: string) => void }) {
  const gruppo = useRef<THREE.Group>(null)
  const { gl, scene, camera } = useThree()
  const [demo] = useState(() => creaDemo(c))
  const frame = useRef(0)

  useFrame(() => {
    frame.current++
    const gr = gruppo.current
    if (!gr) return
    if (frame.current === 2) {
      const box = new THREE.Box3().setFromObject(gr)
      const size = box.getSize(new THREE.Vector3())
      const ctr = box.getCenter(new THREE.Vector3())
      const cam = camera as THREE.PerspectiveCamera
      const raggio = Math.max(size.length() / 2, 0.3)
      const dist = (raggio / Math.sin(THREE.MathUtils.degToRad(cam.fov / 2))) * 0.98
      const dir = new THREE.Vector3(...demo.dir).normalize()
      cam.position.copy(ctr).addScaledVector(dir, dist)
      cam.near = dist / 50
      cam.far = dist * 8
      cam.lookAt(ctr)
      cam.updateProjectionMatrix()
    }
    if (frame.current === 5) {
      gl.render(scene, camera)
      fine(c.id, gl.domElement.toDataURL('image/png'))
    }
  })
  return <group ref={gruppo}>{demo.node}</group>
}

function Scena({ c, fine }: { c: Componente | null; fine: (id: string, url: string) => void }) {
  return (
    <>
      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#d4e0f4', '#2a2c36', 1.0]} />
      <directionalLight position={[5, 8, 7]} intensity={2.6} />
      <directionalLight position={[-6, 3, -4]} intensity={2.2} color="#9bdcff" />
      <directionalLight position={[6, 2, -6]} intensity={1.6} color="#ffffff" />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={2.2} position={[0, 6, 5]} scale={[14, 5, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.2} position={[-8, 2, 2]} rotation-y={Math.PI / 2} scale={[8, 6, 1]} color="#9bdcff" />
        <Lightformer form="rect" intensity={1} position={[8, 1, 3]} rotation-y={-Math.PI / 2} scale={[8, 6, 1]} color="#c7b8ff" />
      </Environment>
      {c && <Lavoro key={c.id} c={c} fine={fine} />}
    </>
  )
}

/** Renderer nascosto: crea le miniature 3D dei componenti, una alla volta. */
export default function GeneratoreMiniature() {
  const [corrente, setCorrente] = useState<Componente | null>(null)

  useEffect(() => {
    const prossimo = () => {
      setCorrente((att) => att ?? coda.shift() ?? null)
    }
    prossimo()
    const off = iscrivi(prossimo)
    return () => {
      off()
      coda.length = 0
      inCoda.clear()
    }
  }, [])

  const fine = (id: string, url: string) => {
    cache.set(id, url)
    inCoda.delete(id)
    avvisa()
    setTimeout(() => setCorrente(coda.shift() ?? null), 30)
  }

  return (
    <div aria-hidden="true" style={{ position: 'fixed', left: -10000, top: 0, width: L, height: A, pointerEvents: 'none' }}>
      <Canvas
        frameloop={corrente ? 'always' : 'never'}
        dpr={1}
        camera={{ fov: 30, near: 0.1, far: 100, position: [0, 0, 8] }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.1
          gl.setClearColor(0x000000, 0)
        }}
      >
        <Scena c={corrente} fine={fine} />
      </Canvas>
    </div>
  )
}
