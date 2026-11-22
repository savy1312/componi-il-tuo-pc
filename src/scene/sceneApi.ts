import type { WebGLRenderer } from 'three'

/** Riferimento condiviso al renderer della scena 3D, usato per esportare immagini e video. */
export const sceneApi: { gl: WebGLRenderer | null } = { gl: null }

export type FormatoImmagine = 'png' | 'jpeg' | 'webp'

export function catturaDataUrl(formato: FormatoImmagine = 'png', qualita = 0.92): string | null {
  const gl = sceneApi.gl
  if (!gl) return null
  return gl.domElement.toDataURL(`image/${formato}`, qualita)
}

/** Miniatura ridotta della scena, salvata insieme al progetto. */
export function catturaMiniatura(w = 360, h = 225): string | null {
  const gl = sceneApi.gl
  if (!gl) return null
  const src = gl.domElement
  if (!src.width || !src.height) return null
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) return null
  const ra = src.width / src.height
  const rb = w / h
  let sw = src.width
  let sh = src.height
  if (ra > rb) sw = sh * rb
  else sh = sw / rb
  ctx.drawImage(src, (src.width - sw) / 2, (src.height - sh) / 2, sw, sh, 0, 0, w, h)
  return c.toDataURL('image/jpeg', 0.8)
}

/** Controlli camera esposti alla UI (zoom rapido). */
export const cameraApi: { zoom: (fattore: number) => void } = { zoom: () => {} }
