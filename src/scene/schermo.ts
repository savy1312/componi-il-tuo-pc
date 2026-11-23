import * as THREE from 'three'

export interface DatiSchermo {
  modo: 'monitoraggio' | 'desktop' | 'sfondo' | 'spento'
  sfondo?: string
  nome: string
  cpu?: string
  gpu?: string
  ram?: string
  ssd?: string
  prezzo: string
  carico: number
  /** Colori principali dell'illuminazione RGB della build. */
  accenti: [string, string]
}

const W = 1280
const H = 720

function barra(c: CanvasRenderingContext2D, x: number, y: number, w: number, v: number, col: string, etichetta: string, valore: string) {
  c.fillStyle = 'rgba(255,255,255,0.55)'
  c.font = '500 20px Inter, system-ui, sans-serif'
  c.textAlign = 'left'
  c.fillText(etichetta, x, y - 10)
  c.textAlign = 'right'
  c.fillStyle = '#fff'
  c.fillText(valore, x + w, y - 10)
  c.fillStyle = 'rgba(255,255,255,0.1)'
  c.fillRect(x, y, w, 12)
  c.fillStyle = col
  c.fillRect(x, y, w * Math.max(0.02, Math.min(1, v)), 12)
}

function sfondoBase(c: CanvasRenderingContext2D, [a, b]: [string, string]) {
  const g = c.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, '#050b1f')
  g.addColorStop(0.55, '#0c1a42')
  g.addColorStop(1, '#050816')
  c.fillStyle = g
  c.fillRect(0, 0, W, H)
  for (const [x, y, col] of [[220, 520, a], [1050, 160, b]] as const) {
    const r = c.createRadialGradient(x, y, 10, x, y, 480)
    r.addColorStop(0, col + '55')
    r.addColorStop(1, 'rgba(0,0,0,0)')
    c.fillStyle = r
    c.fillRect(0, 0, W, H)
  }
}

/** Disegna il contenuto del monitor. Il monitoraggio è una stima: mostra valori plausibili per la build. */
export function disegnaSchermo(c: CanvasRenderingContext2D, d: DatiSchermo, img?: HTMLImageElement | null) {
  c.clearRect(0, 0, W, H)
  if (d.modo === 'spento') {
    c.fillStyle = '#06070a'
    c.fillRect(0, 0, W, H)
    const g = c.createLinearGradient(0, 0, W, H)
    g.addColorStop(0, 'rgba(255,255,255,0.05)')
    g.addColorStop(0.5, 'rgba(255,255,255,0)')
    c.fillStyle = g
    c.fillRect(0, 0, W, H)
    return
  }
  if (d.modo === 'sfondo' && img) {
    const r = Math.max(W / img.width, H / img.height)
    c.drawImage(img, (W - img.width * r) / 2, (H - img.height * r) / 2, img.width * r, img.height * r)
    return
  }
  sfondoBase(c, d.accenti)
  if (d.modo === 'desktop' || d.modo === 'sfondo') {
    // finestra dell'app + barra delle applicazioni
    c.fillStyle = 'rgba(14,22,50,0.92)'
    c.beginPath()
    c.roundRect(190, 110, 900, 440, 14)
    c.fill()
    c.fillStyle = 'rgba(255,255,255,0.08)'
    c.fillRect(190, 110, 900, 44)
    c.fillStyle = '#fff'
    c.font = '600 20px Inter, system-ui, sans-serif'
    c.textAlign = 'left'
    c.fillText(`Componi il tuo PC — ${d.nome}`, 214, 139)
    c.font = '700 54px Inter, system-ui, sans-serif'
    c.fillText(d.nome, 230, 260)
    c.font = '500 26px Inter, system-ui, sans-serif'
    c.fillStyle = 'rgba(255,255,255,0.7)'
    c.fillText(d.cpu ?? 'Processore', 230, 320)
    c.fillText(d.gpu ?? 'Scheda video', 230, 360)
    c.fillText(`${d.ram ?? 'RAM'}  ·  ${d.ssd ?? 'SSD'}`, 230, 400)
    c.fillStyle = d.accenti[0]
    c.font = '700 40px Inter, system-ui, sans-serif'
    c.fillText(d.prezzo, 230, 490)
    c.fillStyle = 'rgba(255,255,255,0.14)'
    c.fillRect(0, H - 56, W, 56)
    c.fillStyle = 'rgba(255,255,255,0.85)'
    for (let i = 0; i < 6; i++) c.fillRect(W / 2 - 150 + i * 54, H - 40, 30, 28)
    c.font = '600 20px Inter, system-ui, sans-serif'
    c.textAlign = 'right'
    c.fillText('12:30', W - 26, H - 20)
    return
  }
  // monitoraggio
  const seed = Math.round(d.carico) % 97
  const fps = 118 + (seed % 60)
  const tGpu = Math.min(84, 52 + Math.round(d.carico / 24))
  const tCpu = Math.min(80, 44 + Math.round(d.carico / 30))
  c.fillStyle = '#fff'
  c.font = '700 26px Inter, system-ui, sans-serif'
  c.textAlign = 'left'
  c.fillText(d.nome, 60, 76)
  c.font = '500 18px Inter, system-ui, sans-serif'
  c.fillStyle = 'rgba(255,255,255,0.5)'
  c.fillText('MONITORAGGIO · valori stimati per questa build', 60, 106)
  c.fillStyle = d.accenti[0]
  c.font = '800 190px Inter, system-ui, sans-serif'
  c.fillText(String(fps), 60, 330)
  c.fillStyle = 'rgba(255,255,255,0.6)'
  c.font = '600 30px Inter, system-ui, sans-serif'
  c.fillText('FPS', 70, 378)
  barra(c, 700, 190, 520, 0.72, d.accenti[0], `GPU · ${(d.gpu ?? '').replace(/^(ASUS|MSI|Gigabyte|NVIDIA|AMD)\s+/i, '')}`.slice(0, 30), `${tGpu}°C · 72%`)
  barra(c, 700, 270, 520, 0.38, d.accenti[1], `CPU · ${d.cpu ?? ''}`.slice(0, 30), `${tCpu}°C · 38%`)
  barra(c, 700, 350, 520, 0.46, '#34d399', 'RAM', `${d.ram ?? ''}`)
  barra(c, 700, 430, 520, Math.min(1, d.carico / 1000), '#f59e0b', 'Consumo stimato', `${Math.round(d.carico)} W`)
  c.fillStyle = 'rgba(255,255,255,0.14)'
  c.fillRect(60, 470, W - 120, 2)
  c.fillStyle = 'rgba(255,255,255,0.7)'
  c.font = '500 22px Inter, system-ui, sans-serif'
  c.fillText(`${d.ssd ?? 'SSD'}   ·   Totale build ${d.prezzo}`, 60, 520)
  // grafico fittizio ma coerente (andamento frame time)
  c.strokeStyle = d.accenti[0]
  c.lineWidth = 3
  c.beginPath()
  for (let i = 0; i <= 60; i++) {
    const x = 60 + i * ((W - 120) / 60)
    const y = 640 - 40 * Math.sin(i * 0.5 + seed) * 0.5 - 18 * Math.sin(i * 1.7 + seed * 2) - 14
    if (i) c.lineTo(x, y)
    else c.moveTo(x, y)
  }
  c.stroke()
}

export function creaTexturaSchermo() {
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const t = new THREE.CanvasTexture(cv)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return { cv, t }
}
