import { specifiche, specChiave } from '../data/categorie'
import { trova } from '../data/hardware'
import type { Analisi } from '../engine/compat'
import { ETICHETTE_CATEGORIA, risolvi } from '../engine/compat'
import type { StatoCatalogo } from '../engine/catalogo'
import type { Componente, Progetto } from '../types'
import { CATEGORIE } from '../types'
import { catturaDataUrl, catturaMiniatura, sceneApi } from '../scene/sceneApi'
import type { FormatoImmagine } from '../scene/sceneApi'
import { dataIt, euro } from './format'
import { linkCondivisione } from './share'

export interface ImpostazioniUi {
  camera: string
  esploso: boolean
  vetro: boolean
  autoRotazione: boolean
  catalogo: StatoCatalogo
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'build'

export function scaricaBlob(nomeFile: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  scaricaUrl(nomeFile, url)
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export function scaricaUrl(nomeFile: string, url: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = nomeFile
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function elencoComponenti(p: Progetto): { categoria: string; c: Componente }[] {
  const r = risolvi(p.sel)
  const out: { categoria: string; c: Componente }[] = []
  for (const cat of CATEGORIE) {
    const v = r[cat as keyof typeof r]
    const lista = Array.isArray(v) ? v : v ? [v as Componente] : []
    lista.forEach((c) => out.push({ categoria: ETICHETTE_CATEGORIA[cat], c }))
  }
  return out
}

/* ----------------------------------------------------------------- JSON */

export function costruisciJson(p: Progetto, a: Analisi, ui: ImpostazioniUi) {
  return {
    applicazione: 'Componi il tuo PC',
    versioneFormato: 1,
    nomeBuild: p.nome,
    dataCreazione: p.creato,
    dataEsportazione: new Date().toISOString(),
    componenti: elencoComponenti(p).map(({ categoria, c }) => ({
      categoria,
      id: c.id,
      nome: c.nome,
      marca: c.marca,
      prezzo: c.prezzo,
      wattaggio: c.wattaggio,
      specifiche: Object.fromEntries(specifiche(c)),
    })),
    prezzoTotale: a.prezzo,
    valuta: 'EUR',
    wattaggio: { caricoStimato: a.tel.carico, riposoStimato: a.tel.riposo, potenzaAlimentatore: a.tel.potenzaPsu, margine: a.tel.margine },
    statoCompatibilita: { stato: a.stato, punteggio: a.punteggio, problemi: a.problemi.map((x) => ({ gravita: x.gravita, messaggio: x.messaggio, suggerimento: x.suggerimento ?? null })) },
    impostazioniRgb: p.rgb,
    impostazioniCamera: { vista: ui.camera },
    impostazioniVista: { vistaEsplosa: ui.esploso, pannelloVetro: ui.vetro, autoRotazione: ui.autoRotazione, gpuVerticale: p.gpuVerticale },
    impostazioniFiltri: ui.catalogo.filtri,
    impostazioniOrdinamento: ui.catalogo.ordine,
    impostazioniRicerca: ui.catalogo.ricerca,
    impostazioniPreset: p.presetId ?? null,
    impostazioniEsportazione: { formato: 'json', linkCondivisione: linkCondivisione(p) },
  }
}

export function esportaJson(p: Progetto, a: Analisi, ui: ImpostazioniUi) {
  const blob = new Blob([JSON.stringify(costruisciJson(p, a, ui), null, 2)], { type: 'application/json' })
  scaricaBlob(`${slug(p.nome)}.json`, blob)
}

/* ----------------------------------------------------------------- Testo */

export function riepilogoTesto(p: Progetto, a: Analisi): string {
  const righe = [`${p.nome.toUpperCase()}`, `Creata il ${dataIt(p.creato)}`, '']
  for (const { categoria, c } of elencoComponenti(p)) righe.push(`• ${categoria}: ${c.nome} — ${euro(c.prezzo)}`)
  righe.push('', `Totale: ${euro(a.prezzo)}`, `Consumo stimato: ${a.tel.carico} W (alimentatore ${a.tel.potenzaPsu || '—'} W)`, `Stato: ${a.stato}`)
  if (a.problemi.length) {
    righe.push('', 'Avvisi:')
    a.problemi.forEach((x) => righe.push(`- [${x.gravita === 'critico' ? 'Critico' : x.gravita === 'attenzione' ? 'Attenzione' : 'Info'}] ${x.messaggio}`))
  }
  return righe.join('\n')
}

/* ------------------------------------------------------------------- PDF */

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/** Apre un documento pronto per la stampa: dal dialogo del browser si sceglie "Salva come PDF". */
export function esportaPdf(p: Progetto, a: Analisi): boolean {
  const img = catturaMiniatura(900, 560) ?? p.miniatura ?? ''
  const righe = elencoComponenti(p)
    .map(({ categoria, c }) => `<tr><td>${esc(categoria)}</td><td><strong>${esc(c.nome)}</strong><br><small>${esc(specChiave(c))}</small></td><td class="n">${c.wattaggio ? c.wattaggio + ' W' : '—'}</td><td class="n">${euro(c.prezzo)}</td></tr>`)
    .join('')
  const avvisi = a.problemi
    .map((x) => `<li class="${x.gravita}"><b>${x.gravita === 'critico' ? 'Critico' : x.gravita === 'attenzione' ? 'Attenzione' : 'Info'}:</b> ${esc(x.messaggio)}</li>`)
    .join('')
  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>${esc(p.nome)}</title>
<style>
 body{font-family:system-ui,Segoe UI,Arial,sans-serif;color:#16161b;margin:32px;}
 h1{margin:0 0 4px;font-size:26px} .sub{color:#6b7280;margin-bottom:20px}
 img{width:100%;max-height:320px;object-fit:cover;border-radius:12px;background:#0a0a0c;margin-bottom:20px}
 table{width:100%;border-collapse:collapse;font-size:13px} td,th{padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:left;vertical-align:top}
 th{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280} .n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
 .tot{display:flex;gap:32px;margin:20px 0;font-size:14px} .tot b{display:block;font-size:22px}
 ul{padding-left:18px;font-size:13px} li.critico{color:#b91c1c} li.attenzione{color:#b45309} li.info{color:#475569}
 .st{display:inline-block;padding:4px 12px;border-radius:999px;background:#e0f2fe;color:#0369a1;font-size:12px;font-weight:600}
 footer{margin-top:28px;color:#9ca3af;font-size:11px}
 @media print{body{margin:14mm}}
</style></head><body>
<h1>${esc(p.nome)}</h1><div class="sub">Configurazione creata il ${dataIt(p.creato)} · <span class="st">${esc(a.stato)}</span></div>
${img ? `<img src="${img}" alt="Anteprima 3D della build">` : ''}
<table><thead><tr><th>Categoria</th><th>Componente</th><th class="n">Consumo</th><th class="n">Prezzo</th></tr></thead><tbody>${righe}</tbody></table>
<div class="tot"><div>Totale<b>${euro(a.prezzo)}</b></div><div>Consumo stimato<b>${a.tel.carico} W</b></div><div>Alimentatore<b>${a.tel.potenzaPsu ? a.tel.potenzaPsu + ' W' : '—'}</b></div><div>Margine<b>${a.tel.potenzaPsu ? a.tel.margine + ' W' : '—'}</b></div></div>
${avvisi ? `<h3>Avvisi di compatibilità</h3><ul>${avvisi}</ul>` : '<p>Nessun avviso di compatibilità: tutti i componenti selezionati sono compatibili.</p>'}
<footer>Prezzi e specifiche indicativi · Generato il ${dataIt(new Date().toISOString())} con Componi il tuo PC</footer>
<script>window.onload=function(){setTimeout(function(){window.print()},350)}</script>
</body></html>`
  const w = window.open('', '_blank')
  if (!w) return false
  w.document.open()
  w.document.write(html)
  w.document.close()
  return true
}

/* ------------------------------------------------------- immagini e video */

export function esportaImmagine(p: Progetto, formato: FormatoImmagine): boolean {
  const url = catturaDataUrl(formato)
  if (!url) return false
  scaricaUrl(`${slug(p.nome)}.${formato === 'jpeg' ? 'jpg' : formato}`, url)
  return true
}

export function videoSupportato(): boolean {
  return typeof MediaRecorder !== 'undefined' && !!sceneApi.gl && typeof sceneApi.gl.domElement.captureStream === 'function'
}

/** Registra la scena per alcuni secondi e restituisce un file WebM. */
export async function registraVideo(secondi: number, onTick: (trascorsi: number) => void): Promise<Blob | null> {
  const canvas = sceneApi.gl?.domElement
  if (!canvas || typeof MediaRecorder === 'undefined') return null
  const stream = canvas.captureStream(30)
  const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m))
  if (!mime) return null
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 })
  const pezzi: Blob[] = []
  rec.ondataavailable = (e) => e.data.size && pezzi.push(e.data)
  const fine = new Promise<Blob>((res) => {
    rec.onstop = () => res(new Blob(pezzi, { type: 'video/webm' }))
  })
  rec.start(250)
  const t0 = performance.now()
  const timer = setInterval(() => onTick(Math.min(secondi, (performance.now() - t0) / 1000)), 200)
  await new Promise((r) => setTimeout(r, secondi * 1000))
  clearInterval(timer)
  rec.stop()
  return fine
}

export { trova }
