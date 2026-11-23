import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { impostaAuto, modoAutomatico, pubblicaStatistiche, qualitaEffettiva, vicino } from '../lib/qualita'
import { useStore } from '../store/useStore'

/**
 * Dentro il Canvas: misura gli FPS, li pubblica per il pannello «Prestazioni» e,
 * se la qualità è su Auto, la abbassa quando il 3D è lento e la rialza quando c'è margine.
 */
export function MisuraPrestazioni() {
  const gl = useThree((s) => s.gl)
  const size = useThree((s) => s.size)
  const acc = useRef({ t: 0, n: 0, tot: 0, lento: 0, veloce: 0, dalCambio: 0, vita: 0 })
  // i contatori di draw call e triangoli vanno sommati su tutti i passaggi del frame (post-processing incluso)
  gl.info.autoReset = false

  useFrame((_, dt) => {
    if (document.hidden) return
    const a = acc.current
    a.vita += dt
    a.t += dt
    a.n++
    a.tot += dt
    if (a.t < 0.5) return
    const fps = a.n / a.t
    pubblicaStatistiche({
      fps: Math.round(fps),
      ms: Math.round((a.t / a.n) * 1000 * 10) / 10,
      chiamate: Math.round(gl.info.render.calls / Math.max(1, a.n)),
      triangoli: Math.round(gl.info.render.triangles / Math.max(1, a.n)),
      risoluzione: `${Math.round(size.width * gl.getPixelRatio())}×${Math.round(size.height * gl.getPixelRatio())}`,
    })
    a.t = 0
    a.n = 0
    gl.info.reset()

    // adattamento automatico (solo in modalità Auto, dopo 4 s di riscaldamento)
    const pref = useStore.getState().pref
    if (!modoAutomatico(pref) || a.vita < 4) return
    a.dalCambio += 0.5
    if (fps < 40) {
      a.lento++
      a.veloce = 0
    } else if (fps > 56) {
      a.veloce++
      a.lento = 0
    } else {
      a.lento = 0
      a.veloce = 0
    }
    const corrente = qualitaEffettiva(pref)
    if (a.lento >= 4) {
      const giu = vicino(corrente, -1)
      if (giu !== corrente) impostaAuto(giu)
      a.lento = 0
      a.dalCambio = 0
    } else if (a.veloce >= 14 && a.dalCambio > 30) {
      const su = vicino(corrente, 1)
      if (su !== corrente && su !== '4k') impostaAuto(su)
      a.veloce = 0
      a.dalCambio = 0
    }
  })
  return null
}
