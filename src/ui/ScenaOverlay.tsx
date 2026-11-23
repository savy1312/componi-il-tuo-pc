import { Check, ChevronDown, Eye, Image as ImageIcon, Info, Repeat, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { META } from '../data/categorie'
import { euro } from '../lib/format'
import { useAnalisi } from '../lib/hooks'
import { risolvi } from '../engine/compat'
import { useHover } from '../scene/interazione'
import { useProgettoAttivo, useStore } from '../store/useStore'
import type { Evidenziazione, ModoVista } from '../store/useStore'
import type { Categoria, Componente } from '../types'
import { Bottone } from './base'
import ImgComponente from './ImgComponente'

export function componenteDi(p: { sel: Parameters<typeof risolvi>[0] }, cat: Categoria): Componente | undefined {
  const r = risolvi(p.sel)
  switch (cat) {
    case 'case': return r.case
    case 'scheda-madre': return r['scheda-madre']
    case 'cpu': return r.cpu
    case 'dissipatore': return r.dissipatore
    case 'ram': return r.ram
    case 'gpu': return r.gpu
    case 'ssd': return r.ssd[0]
    case 'alimentatore': return r.alimentatore
    case 'ventole': return r.ventole[0]
    case 'cavi': return r.cavi[0]
  }
}

/** Etichetta che segue il puntatore: nome e dati del componente sotto il mouse. */
export function TooltipScena() {
  const h = useHover()
  const p = useProgettoAttivo()
  const c = useMemo(() => (p && h.cat ? componenteDi(p, h.cat) : undefined), [p, h.cat])
  if (!h.cat || !c) return null
  const m = META[h.cat]
  return (
    <div className="pointer-events-none absolute z-20 max-w-[240px] rounded-xl glass px-3 py-2 text-[12px] shadow-xl anim-fade" style={{ left: Math.min(h.x + 16, 9999), top: h.y + 16 }} role="tooltip">
      <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-cy">
        <m.icona size={12} /> {m.etichetta}
      </p>
      <p className="mt-0.5 font-semibold leading-snug text-txt">{c.nome}</p>
      <p className="mt-0.5 tabular-nums text-mut">
        {euro(c.prezzo)}
        {c.wattaggio > 0 && h.cat !== 'alimentatore' ? ` · ${c.wattaggio} W` : ''}
        {c.capacita ? ` · ${c.capacita}` : ''}
      </p>
      <p className="mt-1 text-[11px] text-mut/80">Clic per selezionare</p>
    </div>
  )
}

/** Scheda del componente scelto con un clic sul 3D: dettagli, sostituisci, rimuovi. */
export function SchedaSelezione({ onSostituisci }: { onSostituisci: () => void }) {
  const sel = useStore((s) => s.selezionato)
  const setSel = useStore((s) => s.setSelezionato)
  const apri = useStore((s) => s.apriModale)
  const rimuovi = useStore((s) => s.rimuovi)
  const toast = useStore((s) => s.toast)
  const setCategoria = useStore((s) => s.setCategoria)
  const p = useProgettoAttivo()
  const c = p && sel ? componenteDi(p, sel) : undefined
  if (!sel || !c) return null
  const m = META[sel]
  return (
    <div className="absolute inset-x-3 bottom-3 z-20 mx-auto max-w-md rounded-2xl glass p-3 shadow-2xl anim-pop sm:bottom-4" role="dialog" aria-label={`Componente selezionato: ${c.nome}`}>
      <div className="flex items-start gap-3">
        <ImgComponente c={c} className="h-16 w-20 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-cy">
            <m.icona size={12} /> {m.etichetta}
          </p>
          <p className="truncate text-[14px] font-semibold text-txt">{c.nome}</p>
          <p className="text-[12px] tabular-nums text-mut">
            {euro(c.prezzo)}
            {c.wattaggio > 0 && sel !== 'alimentatore' ? ` · ${c.wattaggio} W` : ''}
          </p>
        </div>
        <button type="button" onClick={() => setSel(null)} aria-label="Chiudi" className="grid h-7 w-7 place-items-center rounded-lg text-mut transition-colors hover:bg-white/10 hover:text-txt">
          <X size={15} />
        </button>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <Bottone piccolo onClick={() => apri('dettaglio', c.id)}>
          <Info size={13} /> Dettagli
        </Bottone>
        <Bottone
          piccolo
          onClick={() => {
            setCategoria(sel)
            onSostituisci()
          }}
        >
          <Repeat size={13} /> Sostituisci
        </Bottone>
        <Bottone
          piccolo
          variante="pericolo"
          onClick={() => {
            rimuovi(sel, c.id)
            setSel(null)
            toast('info', `${c.nome} rimosso dalla build.`)
          }}
        >
          <Trash2 size={13} /> Rimuovi
        </Bottone>
      </div>
    </div>
  )
}

const EVID: { id: Evidenziazione; nome: string; colore: string }[] = [
  { id: 'nessuna', nome: 'Nessuna', colore: '' },
  { id: 'compatibilita', nome: 'Compatibilità', colore: 'bg-em' },
  { id: 'consigliato', nome: 'Consigliati', colore: 'bg-ind' },
  { id: 'premium', nome: 'Premium', colore: 'bg-[#c084fc]' },
  { id: 'budget', nome: 'Budget', colore: 'bg-[#34d399]' },
  { id: 'silenzioso', nome: 'Silenziosi', colore: 'bg-[#2dd4bf]' },
  { id: 'rgb', nome: 'RGB', colore: 'bg-[#ec4899]' },
]

const SCHERMI: { id: 'monitoraggio' | 'desktop' | 'sfondo' | 'spento'; nome: string }[] = [
  { id: 'monitoraggio', nome: 'Monitoraggio (FPS, temperature)' },
  { id: 'desktop', nome: 'Desktop della build' },
  { id: 'sfondo', nome: 'La tua immagine' },
  { id: 'spento', nome: 'Spento' },
]

const VISTE: { id: ModoVista; nome: string; testo: string }[] = [
  { id: 'normale', nome: 'Normale', testo: 'Il PC com’è, con materiali e luci.' },
  { id: 'componenti', nome: 'Solo componenti', testo: 'Nasconde il case per vedere solo i pezzi.' },
  { id: 'solo-pc', nome: 'Solo PC', testo: 'Toglie scrivania e periferiche.' },
  { id: 'wireframe', nome: 'Wireframe', testo: 'Mostra la struttura a maglia dei modelli 3D.' },
]

/** Menu «Vista»: modalità di visualizzazione ed evidenziazione per stato/tipo. */
export function MenuVista() {
  const evid = useStore((s) => s.evidenzia)
  const setEvid = useStore((s) => s.setEvidenzia)
  const vista = useStore((s) => s.modoVista)
  const setVista = useStore((s) => s.setModoVista)
  const schermo = useStore((s) => s.pref.schermo ?? 'monitoraggio')
  const setPref = useStore((s) => s.setPref)
  const toast = useStore((s) => s.toast)
  const setAmbiente = (a: 'scrivania') => setPref({ ambiente: a })
  const scegliSchermo = (m: NonNullable<Parameters<typeof setPref>[0]['schermo']>) => {
    setPref({ schermo: m, ambiente: 'scrivania' })
    if (m === 'sfondo' && !useStore.getState().pref.sfondoSchermo) toast('info', 'Scegli un\'immagine con «Usa una tua immagine…».')
  }
  /** Ridimensiona l'immagine scelta (max 1280×720) così resta leggera sul dispositivo. */
  const caricaSfondo = async (f?: File) => {
    if (!f) return
    try {
      const bmp = await createImageBitmap(f)
      const cv = document.createElement('canvas')
      cv.width = 1280
      cv.height = 720
      const cx = cv.getContext('2d')!
      const r = Math.max(1280 / bmp.width, 720 / bmp.height)
      cx.drawImage(bmp, (1280 - bmp.width * r) / 2, (720 - bmp.height * r) / 2, bmp.width * r, bmp.height * r)
      setPref({ sfondoSchermo: cv.toDataURL('image/jpeg', 0.8), schermo: 'sfondo' })
      setAmbiente('scrivania')
      toast('successo', 'Immagine applicata al monitor.')
    } catch {
      toast('errore', 'Non riesco a leggere questa immagine. Prova con un JPG o PNG.')
    }
  }
  const [aperto, setAperto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!aperto) return
    const giu = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setAperto(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAperto(false)
    document.addEventListener('mousedown', giu)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', giu)
      document.removeEventListener('keydown', esc)
    }
  }, [aperto])
  const attiva = vista !== 'normale' || evid !== 'nessuna'
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setAperto((v) => !v)} aria-haspopup="menu" aria-expanded={aperto} title="Modalità di visualizzazione ed evidenziazione" className={`flex h-8 items-center gap-1.5 rounded-lg border px-2 text-[11px] font-medium transition-colors ${attiva ? 'border-cy/50 bg-cy/15 text-cy' : 'border-white/[0.08] text-mut hover:border-white/20 hover:text-txt'}`}>
        <Eye size={14} /> Vista <ChevronDown size={12} />
      </button>
      {aperto && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-xl border border-white/10 bg-[#0b1534] p-1 shadow-2xl anim-fade">
          <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-mut">Come vedere il PC</p>
          {VISTE.map((v) => (
            <button key={v.id} type="button" role="menuitemradio" aria-checked={vista === v.id} onClick={() => setVista(v.id)} className={`flex w-full items-start gap-2.5 rounded-lg px-3 py-1.5 text-left hover:bg-white/[0.06] ${vista === v.id ? 'bg-cy/10' : ''}`}>
              <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center">{vista === v.id && <Check size={14} className="text-cy" />}</span>
              <span>
                <span className="block text-[12.5px] font-medium text-txt">{v.nome}</span>
                <span className="block text-[11px] leading-snug text-mut">{v.testo}</span>
              </span>
            </button>
          ))}
          <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-mut">Schermo del monitor</p>
          {SCHERMI.map((v) => (
            <button key={v.id} type="button" role="menuitemradio" aria-checked={schermo === v.id} onClick={() => scegliSchermo(v.id)} className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-left hover:bg-white/[0.06] ${schermo === v.id ? 'bg-cy/10' : ''}`}>
              <span className="grid h-4 w-4 shrink-0 place-items-center">{schermo === v.id && <Check size={14} className="text-cy" />}</span>
              <span className="text-[12.5px] font-medium text-txt">{v.nome}</span>
            </button>
          ))}
          <label className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-1.5 text-left hover:bg-white/[0.06]">
            <span className="grid h-4 w-4 shrink-0 place-items-center">
              <ImageIcon size={14} className="text-mut" />
            </span>
            <span className="text-[12.5px] font-medium text-txt">Usa una tua immagine…</span>
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => void caricaSfondo(e.target.files?.[0])} />
          </label>
          <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-mut">Evidenzia nel 3D</p>
          {EVID.map((v) => (
            <button key={v.id} type="button" role="menuitemradio" aria-checked={evid === v.id} onClick={() => setEvid(v.id)} className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-left hover:bg-white/[0.06] ${evid === v.id ? 'bg-cy/10' : ''}`}>
              <span className="grid h-4 w-4 shrink-0 place-items-center">{evid === v.id ? <Check size={14} className="text-cy" /> : v.colore ? <span className={`h-2.5 w-2.5 rounded-full ${v.colore}`} /> : null}</span>
              <span className="text-[12.5px] font-medium text-txt">{v.nome}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Legenda dell'evidenziazione attiva (compatibilità: verde / avviso / errore / componenti mancanti). */
export function LegendaEvidenzia() {
  const evid = useStore((s) => s.evidenzia)
  const a = useAnalisi()
  if (evid === 'nessuna') return null
  const mancanti = a ? (Object.keys(a.statiCategoria) as Categoria[]).filter((c) => a.statiCategoria[c] === 'Mancante') : []
  const voci: Record<Exclude<Evidenziazione, 'nessuna'>, [string, string][]> = {
    compatibilita: [['bg-em', 'Compatibile'], ['bg-am', 'Da verificare'], ['bg-rd', 'Incompatibile']],
    consigliato: [['bg-ind', 'Consigliato']],
    premium: [['bg-[#c084fc]', 'Premium']],
    budget: [['bg-[#34d399]', 'Budget / Best Value']],
    silenzioso: [['bg-[#2dd4bf]', 'Silenzioso']],
    rgb: [['bg-[#ec4899]', 'Con RGB']],
  }
  return (
    <div className="pointer-events-none absolute left-3 top-[3.9rem] z-10 flex max-w-[70%] flex-wrap items-center gap-x-3 gap-y-1 rounded-xl glass px-3 py-2 text-[11.5px] text-mut sm:top-14" role="status">
      {voci[evid].map(([cls, t]) => (
        <span key={t} className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${cls}`} /> {t}
        </span>
      ))}
      {evid === 'compatibilita' && mancanti.length > 0 && (
        <span className="flex items-center gap-1.5 text-am">
          <span className="h-2.5 w-2.5 rounded-full border border-dashed border-am" /> Mancano: {mancanti.map((c) => META[c].etichetta).join(', ')}
        </span>
      )}
    </div>
  )
}
