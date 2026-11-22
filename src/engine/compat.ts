import { HARDWARE, ex, trova, per } from '../data/hardware'
import type { Categoria, Componente, Problema, Selezione, StatoBuild, StatoCategoria } from '../types'
import { CATEGORIE, CATEGORIE_MULTIPLE } from '../types'

/* ----------------------------------------------------------------------
 * Motore di compatibilità basato su regole.
 * Ogni regola produce un Problema con gravità (critico / attenzione / info),
 * un messaggio specifico e l'elenco dei componenti responsabili.
 * ---------------------------------------------------------------------- */

export interface Risolta {
  case?: Componente
  'scheda-madre'?: Componente
  cpu?: Componente
  gpu?: Componente
  ram?: Componente
  dissipatore?: Componente
  alimentatore?: Componente
  ssd: Componente[]
  ventole: Componente[]
  cavi: Componente[]
}

export const selezioneVuota = (): Selezione => ({ ssd: [], ventole: [], cavi: [] })

export function risolvi(sel: Selezione): Risolta {
  return {
    case: trova(sel.case),
    'scheda-madre': trova(sel['scheda-madre']),
    cpu: trova(sel.cpu),
    gpu: trova(sel.gpu),
    ram: trova(sel.ram),
    dissipatore: trova(sel.dissipatore),
    alimentatore: trova(sel.alimentatore),
    ssd: sel.ssd.map(trova).filter((c): c is Componente => !!c),
    ventole: sel.ventole.map(trova).filter((c): c is Componente => !!c),
    cavi: sel.cavi.map(trova).filter((c): c is Componente => !!c),
  }
}

/** Restituisce una nuova selezione con il componente aggiunto o sostituito. */
export function conComponente(sel: Selezione, c: Componente): Selezione {
  const n: Selezione = { ...sel, ssd: [...sel.ssd], ventole: [...sel.ventole], cavi: [...sel.cavi] }
  if (CATEGORIE_MULTIPLE.includes(c.categoria)) {
    const k = c.categoria as 'ssd' | 'ventole' | 'cavi'
    if (!n[k].includes(c.id)) n[k].push(c.id)
  } else {
    ;(n as unknown as Record<string, unknown>)[c.categoria] = c.id
  }
  return n
}

export function senzaComponente(sel: Selezione, cat: Categoria, id?: string): Selezione {
  const n: Selezione = { ...sel, ssd: [...sel.ssd], ventole: [...sel.ventole], cavi: [...sel.cavi] }
  if (CATEGORIE_MULTIPLE.includes(cat)) {
    const k = cat as 'ssd' | 'ventole' | 'cavi'
    n[k] = id ? n[k].filter((x) => x !== id) : []
  } else {
    delete (n as unknown as Record<string, unknown>)[cat]
  }
  return n
}

export function idsSelezionati(sel: Selezione): string[] {
  const r = risolvi(sel)
  const out: string[] = []
  for (const cat of CATEGORIE) {
    const v = r[cat as keyof Risolta]
    if (Array.isArray(v)) out.push(...v.map((c) => c.id))
    else if (v) out.push((v as Componente).id)
  }
  return out
}

/* ------------------------------------------------------------ radiatori */

const parseRad = (s: string): { pos: string; size: number } => {
  const [pos, size] = s.split('-')
  return { pos, size: Number(size) }
}

/** Posizione in cui il case può montare un radiatore della dimensione richiesta. */
export function posizioneRadiatore(c: Componente | undefined, size: number): 'frontale' | 'superiore' | 'laterale' | null {
  if (!c) return null
  const ordine: ('frontale' | 'laterale' | 'superiore')[] = ['frontale', 'laterale', 'superiore']
  for (const pos of ordine) {
    for (const s of c.supportoRadiatore) {
      const r = parseRad(s)
      if (r.pos !== pos) continue
      if (r.size === size || (size === 240 && r.size === 360)) return pos
    }
  }
  return null
}

/* --------------------------------------------------------------- analisi */

export interface Telemetria {
  carico: number
  riposo: number
  potenzaPsu: number
  margine: number
  percPsu: number
  consigliato: number
  ventoleInstallate: number
  ventoleNecessarie: number
  slotVentole: number
  spazioGpuMm: number | null
  altezzaResiduaMm: number | null
  ramModuli: number
  slotRam: number
  capacitaSsdGb: number
  m2Usati: number
  m2Totali: number
  pcieUsati: number
  pcieDisponibili: number
  radiatori: number
  slotPcieLiberi: number | null
}

export interface Analisi {
  problemi: Problema[]
  prezzo: number
  numComponenti: number
  mancanti: Categoria[]
  stato: StatoBuild
  punteggio: number
  statiCategoria: Record<Categoria, StatoCategoria>
  tel: Telemetria
  critici: number
  attenzioni: number
  informative: number
  completabile: boolean
  motivoBlocco: string
}

export const OBBLIGATORI: Categoria[] = ['case', 'scheda-madre', 'cpu', 'ram', 'alimentatore', 'ssd']

const arrotonda50 = (v: number) => Math.ceil(v / 50) * 50

export function consumi(r: Risolta): { carico: number; riposo: number } {
  const cpu = r.cpu?.wattaggio ?? 0
  const gpu = r.gpu?.wattaggio ?? 0
  const resto =
    (r['scheda-madre']?.wattaggio ?? 0) +
    (r.ram?.wattaggio ?? 0) +
    (r.dissipatore?.wattaggio ?? 0) +
    r.ssd.reduce((s, c) => s + c.wattaggio, 0) +
    r.ventole.reduce((s, c) => s + c.wattaggio, 0) +
    r.cavi.reduce((s, c) => s + c.wattaggio, 0) +
    (r.case ? (r.case.numeroVentole ?? 0) * 3 : 0)
  const base = r.cpu || r.gpu || r['scheda-madre'] ? 25 : 0
  const carico = Math.round(cpu + gpu + resto + base)
  const riposo = Math.round(cpu * 0.12 + gpu * 0.08 + resto * 0.55 + base)
  return { carico, riposo }
}

function ventoleInstallate(r: Risolta): number {
  return (
    (r.case?.numeroVentole ?? 0) +
    r.ventole.reduce((s, c) => s + (c.numeroVentole ?? 0), 0) +
    (r.dissipatore?.formato === 'AIO' ? (r.dissipatore.numeroVentole ?? 0) : 0)
  )
}

function suggerisciCase(r: Risolta, minGpu: number, minCooler: number): string | undefined {
  const formato = r['scheda-madre']?.formato
  const adatti = per('case')
    .filter((c) => (c.lunghezzaMaxGpuCaseMm ?? 0) >= minGpu && (c.altezzaMaxDissipatoreCaseMm ?? 0) >= minCooler && (!formato || c.compatibilita.includes(formato)))
    .sort((a, b) => a.prezzo - b.prezzo)
    .slice(0, 3)
  return adatti.length ? `Case compatibili: ${adatti.map((c) => `${c.nome} ${c.colore.toLowerCase()}`).join(', ')}.` : undefined
}

export function analizza(sel: Selezione): Analisi {
  const r = risolvi(sel)
  const p: Problema[] = []
  const add = (x: Omit<Problema, 'id'> & { id?: string }) => p.push({ ...x, id: x.id ?? `${x.categoria}-${p.length}` })

  const cs = r.case
  const mb = r['scheda-madre']
  const cp = r.cpu
  const gp = r.gpu
  const rm = r.ram
  const di = r.dissipatore
  const ps = r.alimentatore

  // 1. Socket CPU / scheda madre
  if (cp && mb && cp.socket !== mb.socket) {
    add({ id: 'socket', gravita: 'critico', categoria: 'cpu', componenti: [cp.id, mb.id], messaggio: `Socket CPU e scheda madre non compatibili: ${cp.nome} usa ${cp.socket}, mentre ${mb.nome} usa ${mb.socket}.`, suggerimento: `Scegli una CPU ${mb.socket} oppure una scheda madre ${cp.socket}.` })
  }

  // 2. Tipo di RAM
  if (rm && mb && rm.tipoRam !== mb.tipoRam) {
    add({ id: 'ram-tipo', gravita: 'critico', categoria: 'ram', componenti: [rm.id, mb.id], messaggio: `La RAM ${rm.tipoRam} non è compatibile con la scheda madre ${mb.socket} selezionata, che supporta solo ${mb.tipoRam}.`, suggerimento: `Seleziona un kit ${mb.tipoRam}.` })
  }

  // 3. Slot RAM
  if (rm && mb) {
    const moduli = ex.n(rm, 'moduli', 2)
    const slot = ex.n(mb, 'slotRam', 4)
    if (moduli > slot) {
      add({ id: 'ram-slot', gravita: 'critico', categoria: 'ram', componenti: [rm.id, mb.id], messaggio: `Il numero di slot RAM disponibili (${slot}) non è sufficiente per il kit RAM selezionato (${moduli} moduli).`, suggerimento: 'Scegli un kit da 2 moduli.' })
    }
  }

  // 4. Formato scheda madre / case
  if (mb && cs && !cs.compatibilita.includes(mb.formato ?? '')) {
    add({ id: 'formato', gravita: 'critico', categoria: 'scheda-madre', componenti: [mb.id, cs.id], messaggio: `La scheda madre ${mb.formato} non è compatibile con il case selezionato, che supporta ${cs.compatibilita.join(', ')}.`, suggerimento: 'Cambia case oppure scegli una scheda madre di formato più piccolo.' })
  }

  // 5. Lunghezza GPU / case
  if (gp && cs) {
    const diff = (gp.lunghezzaGpuMm ?? 0) - (cs.lunghezzaMaxGpuCaseMm ?? 0)
    if (diff > 0) {
      add({ id: 'gpu-lunga', gravita: 'critico', categoria: 'gpu', componenti: [gp.id, cs.id], messaggio: `La GPU selezionata è troppo lunga di ${diff} mm per il case attuale.`, suggerimento: suggerisciCase(r, gp.lunghezzaGpuMm ?? 0, 0) })
    } else if (diff > -10) {
      add({ id: 'gpu-margine', gravita: 'info', categoria: 'gpu', componenti: [gp.id, cs.id], messaggio: `La GPU entra nel case con soli ${-diff} mm di margine: il flusso d’aria frontale potrebbe risultare limitato.` })
    }
    // Spessore GPU / slot PCIe del case
    const slotGpu = ex.n(gp, 'slot', 2)
    const slotCase = ex.n(cs, 'slotPcie', 7)
    if (Math.ceil(slotGpu) > slotCase) {
      add({ id: 'gpu-slot', gravita: 'critico', categoria: 'gpu', componenti: [gp.id, cs.id], messaggio: `La GPU occupa ${slotGpu} slot ma il case ne offre solo ${slotCase}.` })
    }
  }

  // 6. Dissipatore ad aria / altezza case
  if (di && cs && di.formato === 'Aria') {
    const diff = (di.altezzaDissipatoreMm ?? 0) - (cs.altezzaMaxDissipatoreCaseMm ?? 0)
    if (diff > 0) {
      add({ id: 'cooler-alto', gravita: 'critico', categoria: 'dissipatore', componenti: [di.id, cs.id], messaggio: `Il dissipatore è troppo alto di ${diff} mm per il case selezionato.`, suggerimento: suggerisciCase(r, 0, di.altezzaDissipatoreMm ?? 0) ?? 'Scegli un dissipatore più basso.' })
    }
  }

  // 7. Radiatore AIO / case
  if (di && cs && di.formato === 'AIO') {
    const size = Number(di.formatoRadiatore)
    if (!posizioneRadiatore(cs, size)) {
      add({ id: 'aio-case', gravita: 'critico', categoria: 'dissipatore', componenti: [di.id, cs.id], messaggio: `Il dissipatore AIO da ${size} mm richiede un supporto frontale o superiore non disponibile nel case scelto.`, suggerimento: 'Scegli un radiatore più piccolo o un case con più supporti per radiatori.' })
    }
  }

  // 8. Socket del dissipatore e capacità termica
  if (di && cp) {
    if (!di.compatibilita.includes(cp.socket ?? '')) {
      add({ id: 'cooler-socket', gravita: 'critico', categoria: 'dissipatore', componenti: [di.id, cp.id], messaggio: `Il dissipatore non supporta il socket ${cp.socket} della CPU selezionata.` })
    }
    const tdp = ex.n(di, 'tdpMax', 0)
    if (tdp && cp.wattaggio > tdp) {
      add({ id: 'cooler-tdp', gravita: 'attenzione', categoria: 'dissipatore', componenti: [di.id, cp.id], messaggio: `Il dissipatore gestisce circa ${tdp} W ma la CPU può assorbirne ${cp.wattaggio} W: potrebbero comparire limitazioni termiche.`, suggerimento: 'Valuta un AIO da 280 o 360 mm.' })
    }
  }

  // 9. RAM / dissipatore ad aria
  if (rm && di && di.formato === 'Aria') {
    const h = ex.n(rm, 'altezzaMm', 34)
    const margine = ex.n(di, 'margineRamMm', 99)
    if (h > margine) {
      add({ id: 'ram-cooler', gravita: 'attenzione', categoria: 'ram', componenti: [rm.id, di.id], messaggio: `RAM e dissipatore potrebbero entrare in conflitto: i moduli sono alti ${h} mm, il dissipatore lascia ${margine} mm.`, suggerimento: 'Usa RAM low profile oppure sposta la ventola anteriore del dissipatore.' })
    }
  }

  // 10. Formato PSU / case
  if (ps && cs) {
    const f = ex.s(cs, 'psu', 'ATX')
    if (f === 'SFX' && ps.formato === 'ATX') {
      add({ id: 'psu-formato', gravita: 'critico', categoria: 'alimentatore', componenti: [ps.id, cs.id], messaggio: 'L’alimentatore ATX non entra nel case selezionato, che accetta solo alimentatori SFX.', suggerimento: 'Scegli un alimentatore SFX.' })
    } else if (f === 'ATX' && ps.formato === 'SFX') {
      add({ id: 'psu-sfx', gravita: 'info', categoria: 'alimentatore', componenti: [ps.id, cs.id], messaggio: 'L’alimentatore SFX entra nel case ATX solo con una staffa adattatrice (non inclusa).' })
    }
  }

  // 11. Potenza
  const { carico, riposo } = consumi(r)
  if (ps) {
    const pw = ps.wattaggio
    const ids = [ps.id, ...(cp ? [cp.id] : []), ...(gp ? [gp.id] : [])]
    if (carico > pw) {
      add({ id: 'potenza', gravita: 'critico', categoria: 'alimentatore', componenti: ids, messaggio: `Il consumo stimato supera la capacità dell’alimentatore di ${carico - pw} W.`, suggerimento: `Serve un alimentatore da almeno ${arrotonda50(carico * 1.3)} W.` })
    } else if (pw < carico * 1.25) {
      add({ id: 'potenza-margine', gravita: 'attenzione', categoria: 'alimentatore', componenti: ids, messaggio: `Margine di potenza ridotto: ${pw - carico} W disponibili su ${pw} W.`, suggerimento: `Per lavorare con più margine punta a ${arrotonda50(carico * 1.3)} W.` })
    } else if (pw > carico * 2.6 && pw >= 750) {
      add({ id: 'potenza-over', gravita: 'info', categoria: 'alimentatore', componenti: [ps.id], messaggio: `L’alimentatore è molto sovradimensionato: ${pw} W per un consumo stimato di ${carico} W. Funzionerà, ma con efficienza ridotta a basso carico.` })
    }
  }

  // 12. Connettori PCIe e 12VHPWR
  if (gp && ps) {
    const need = gp.connettoriPCIe ?? 0
    const have = ps.connettoriPCIe ?? 0
    if (need > have) {
      add({ id: 'pcie-conn', gravita: 'critico', categoria: 'alimentatore', componenti: [gp.id, ps.id], messaggio: `Il numero di connettori PCIe disponibili (${have}) non è sufficiente per la GPU selezionata (${need} richiesti).`, suggerimento: 'Scegli un alimentatore con più connettori PCIe.' })
    }
    if (ex.b(gp, 'richiede12vhpwr') && !ex.b(ps, 'nativo12vhpwr')) {
      const haAdattatore = r.cavi.some((c) => ex.b(c, 'hvpwr'))
      if (!haAdattatore) {
        add({ id: '12vhpwr', gravita: 'attenzione', categoria: 'cavi', componenti: [gp.id, ps.id], messaggio: 'La GPU usa il connettore 12VHPWR e l’alimentatore non ha un cavo nativo: serve un adattatore.', suggerimento: 'Aggiungi un cavo o un adattatore 12VHPWR dalla categoria Cavi e Accessori.' })
      }
    }
  }
  if (r.cavi.some((c) => ex.b(c, 'hvpwr') && c.extra.tipo !== 'Sleeved cable') && gp && !ex.b(gp, 'richiede12vhpwr')) {
    const c = r.cavi.find((x) => ex.b(x, 'hvpwr'))!
    add({ id: 'cavo-inutile', gravita: 'info', categoria: 'cavi', componenti: [c.id, gp.id], messaggio: 'Il cavo 12VHPWR non serve: la GPU selezionata usa connettori PCIe tradizionali.' })
  }

  // 13. SSD / slot M.2
  const nvme = r.ssd.filter((c) => c.formato === 'M.2 NVMe').length
  const sata = r.ssd.length - nvme
  if (mb && nvme > ex.n(mb, 'slotM2', 2)) {
    const ssdIds = r.ssd.filter((c) => c.formato === 'M.2 NVMe').map((c) => c.id)
    add({ id: 'm2', gravita: 'critico', categoria: 'ssd', componenti: [...ssdIds, mb.id], messaggio: `Il numero di slot M.2 disponibili (${ex.n(mb, 'slotM2', 2)}) non è sufficiente per gli SSD selezionati (${nvme}).`, suggerimento: 'Rimuovi un SSD M.2 oppure scegli una scheda madre con più slot.' })
  }
  if (sata > 4) add({ id: 'sata', gravita: 'attenzione', categoria: 'ssd', componenti: r.ssd.filter((c) => c.formato === 'SATA').map((c) => c.id), messaggio: 'Hai selezionato più di 4 unità SATA: le baie del case potrebbero non bastare.' })

  // 14. Ventole
  const installate = ventoleInstallate(r)
  const calore = (cp?.wattaggio ?? 0) + (gp?.wattaggio ?? 0)
  const necessarieBase = calore > 450 ? 5 : calore > 300 ? 4 : 3
  const slotV = ex.n(cs, 'slotVentole', 0)
  // nei case compatti il numero di posizioni disponibili limita le ventole realisticamente installabili
  const necessarie = slotV > 0 && slotV <= 4 ? Math.min(necessarieBase, slotV) : necessarieBase
  if (cs && (cp || gp) && installate < necessarie) {
    add({ id: 'ventole', gravita: 'attenzione', categoria: 'ventole', componenti: [], messaggio: `Il numero di ventole installate (${installate}) è insufficiente per un buon flusso d’aria: per questa configurazione ne consigliamo almeno ${necessarie}.`, suggerimento: 'Aggiungi un set di ventole dalla categoria Ventole.' })
  }
  if (cs) {
    const slot = ex.n(cs, 'slotVentole', 6)
    const extra = r.ventole.reduce((s, c) => s + (c.numeroVentole ?? 0), 0) + (cs.numeroVentole ?? 0)
    if (extra > slot) {
      add({ id: 'ventole-slot', gravita: 'attenzione', categoria: 'ventole', componenti: r.ventole.map((c) => c.id), messaggio: `Hai ${extra} ventole ma il case ha solo ${slot} posizioni di montaggio: alcune non potranno essere installate.` })
    }
  }

  // 15. GPU mancante
  if (cp && !gp) {
    if (ex.b(cp, 'igpu')) add({ id: 'no-gpu-igpu', gravita: 'info', categoria: 'gpu', componenti: [cp.id], messaggio: 'Nessuna scheda video selezionata: userai la grafica integrata della CPU, adatta a lavoro e uso leggero.' })
    else add({ id: 'no-gpu', gravita: 'attenzione', categoria: 'gpu', componenti: [cp.id], messaggio: 'La CPU non ha grafica integrata: serve una scheda video per ottenere l’immagine a schermo.', suggerimento: 'Seleziona una GPU.' })
  }

  // Elementi mancanti
  const mancanti: Categoria[] = []
  for (const c of OBBLIGATORI) {
    const v = c === 'ssd' ? r.ssd.length > 0 : !!r[c as keyof Risolta]
    if (!v) mancanti.push(c)
  }
  if (cp && !di && !ex.b(cp, 'coolerIncluso')) mancanti.push('dissipatore')
  if (cp && !di && ex.b(cp, 'coolerIncluso')) {
    add({ id: 'cooler-stock', gravita: 'info', categoria: 'dissipatore', componenti: [cp.id], messaggio: 'La CPU include un dissipatore di serie: per temperature e rumore migliori puoi aggiungerne uno dedicato.' })
  }

  const critici = p.filter((x) => x.gravita === 'critico').length
  const attenzioni = p.filter((x) => x.gravita === 'attenzione').length
  const informative = p.filter((x) => x.gravita === 'info').length
  const punteggio = Math.max(0, Math.min(100, 100 - critici * 25 - attenzioni * 8 - informative * 2 - mancanti.length * 10))

  let stato: StatoBuild
  const nSel = idsSelezionati(sel).length
  if (critici > 0) stato = 'Build non valida'
  else if (mancanti.length > 0 || nSel === 0) stato = 'Configurazione incompleta'
  else if (attenzioni > 0) stato = 'Build da verificare'
  else if (punteggio >= 96) stato = 'Build ottimizzata'
  else stato = 'Build valida'

  // Stati per categoria
  const statiCategoria = {} as Record<Categoria, StatoCategoria>
  for (const cat of CATEGORIE) {
    const v = r[cat as keyof Risolta]
    const comps: Componente[] = Array.isArray(v) ? v : v ? [v as Componente] : []
    if (comps.length) {
      const ids = comps.map((c) => c.id)
      const mie = p.filter((x) => x.componenti.some((i) => ids.includes(i)) || (x.categoria === cat && x.componenti.length === 0))
      if (mie.some((x) => x.gravita === 'critico')) statiCategoria[cat] = 'Incompatibile'
      else if (mie.some((x) => x.gravita === 'attenzione')) statiCategoria[cat] = 'Da verificare'
      else if (mie.length) statiCategoria[cat] = 'Selezionato'
      else statiCategoria[cat] = 'Completato'
    } else if (mancanti.includes(cat)) {
      statiCategoria[cat] = ['case', 'scheda-madre', 'cpu'].includes(cat) ? 'Critico' : 'Mancante'
    } else if (cat === 'gpu') {
      statiCategoria[cat] = cp && !ex.b(cp, 'igpu') ? 'Mancante' : 'Consigliato'
    } else if (cat === 'ventole') {
      statiCategoria[cat] = p.some((x) => x.id === 'ventole') ? 'Consigliato' : 'Opzionale'
    } else statiCategoria[cat] = 'Opzionale'
  }

  const prezzo = idsSelezionati(sel).reduce((s, id) => s + (trova(id)?.prezzo ?? 0), 0)
  const pw = ps?.wattaggio ?? 0
  const m2Tot = ex.n(mb, 'slotM2', 0)
  const slotRam = ex.n(mb, 'slotRam', 0)
  const radiatori = cs ? cs.supportoRadiatore.filter((s) => s.startsWith('frontale') || s.startsWith('superiore') || s.startsWith('laterale')).length : 0
  const tel: Telemetria = {
    carico,
    riposo,
    potenzaPsu: pw,
    margine: pw - carico,
    percPsu: pw ? Math.min(150, Math.round((carico / pw) * 100)) : 0,
    consigliato: carico ? arrotonda50(carico * 1.3) : 0,
    ventoleInstallate: installate,
    ventoleNecessarie: necessarie,
    slotVentole: ex.n(cs, 'slotVentole', 0),
    spazioGpuMm: cs && gp ? (cs.lunghezzaMaxGpuCaseMm ?? 0) - (gp.lunghezzaGpuMm ?? 0) : cs ? (cs.lunghezzaMaxGpuCaseMm ?? 0) : null,
    altezzaResiduaMm: cs ? (cs.altezzaMaxDissipatoreCaseMm ?? 0) - (di?.formato === 'Aria' ? (di.altezzaDissipatoreMm ?? 0) : 0) : null,
    ramModuli: rm ? ex.n(rm, 'moduli', 2) : 0,
    slotRam,
    capacitaSsdGb: r.ssd.reduce((s, c) => s + ex.n(c, 'capGb', 0), 0),
    m2Usati: nvme,
    m2Totali: m2Tot,
    pcieUsati: gp?.connettoriPCIe ?? 0,
    pcieDisponibili: ps?.connettoriPCIe ?? 0,
    radiatori,
    slotPcieLiberi: cs ? ex.n(cs, 'slotPcie', 0) - (gp ? Math.ceil(ex.n(gp, 'slot', 2)) : 0) : null,
  }

  const completabile = critici === 0 && mancanti.length === 0 && nSel > 0
  const motivoBlocco = critici > 0 ? `Risolvi prima le ${critici} incompatibilità critiche.` : mancanti.length ? `Mancano componenti essenziali: ${mancanti.map(etichettaCategoria).join(', ')}.` : nSel === 0 ? 'Aggiungi almeno un componente alla build.' : ''

  return { problemi: p, prezzo, numComponenti: nSel, mancanti, stato, punteggio, statiCategoria, tel, critici, attenzioni, informative, completabile, motivoBlocco }
}

export const ETICHETTE_CATEGORIA: Record<Categoria, string> = {
  case: 'Case',
  'scheda-madre': 'Scheda Madre',
  cpu: 'Processore (CPU)',
  gpu: 'Scheda Video (GPU)',
  ram: 'Memoria RAM',
  dissipatore: 'Dissipatore',
  ssd: 'Archiviazione (SSD)',
  alimentatore: 'Alimentatore (PSU)',
  ventole: 'Ventole',
  cavi: 'Cavi e Accessori',
}
export const etichettaCategoria = (c: Categoria) => ETICHETTE_CATEGORIA[c]

/* ------------------------------------------------------- candidati/catalogo */

export type Livello = 'ok' | 'attenzione' | 'critico'
export interface EsitoCandidato {
  livello: Livello
  problemi: Problema[]
}

/** Valuta cosa succederebbe aggiungendo (o sostituendo con) il componente alla build. */
export function valutaCandidato(sel: Selezione, c: Componente): EsitoCandidato {
  const nuova = conComponente(sel, c)
  const a = analizza(nuova)
  const mie = a.problemi.filter((x) => x.componenti.includes(c.id) && x.gravita !== 'info')
  const livello: Livello = mie.some((x) => x.gravita === 'critico') ? 'critico' : mie.length ? 'attenzione' : 'ok'
  return { livello, problemi: mie }
}

/** Alternative compatibili nella stessa categoria, ordinate per vicinanza di prezzo. */
export function alternative(sel: Selezione, c: Componente, n = 3): Componente[] {
  return HARDWARE.filter((x) => x.categoria === c.categoria && x.id !== c.id && valutaCandidato(sel, x).livello !== 'critico')
    .sort((a, b) => Math.abs(a.prezzo - c.prezzo) - Math.abs(b.prezzo - c.prezzo))
    .slice(0, n)
}
