import { Box, Copy, Download, FolderOpen, Layers3, LayoutGrid, Link2, MoreHorizontal, Plus, RotateCcw, Save, Sparkles } from 'lucide-react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { META } from '../data/categorie'
import { ex, trova } from '../data/hardware'
import { euro } from '../lib/format'
import { useAnalisi, useMediaQuery } from '../lib/hooks'
import { copiaTesto, linkCondivisione } from '../lib/share'
import { catturaMiniatura, sceneApi } from '../scene/sceneApi'
import { useProgettoAttivo, useStore } from '../store/useStore'
import { Badge, Bottone, Interruttore, Vuoto, tonoBuild, tonoCategoria } from '../ui/base'
import { Catalogo } from '../ui/Catalogo'
import { BannerGuida, ElencoPassi } from '../ui/Percorso'
import { BarraCamera, PannelloDestro, PannelloRgb } from '../ui/pannelli'

const PcScene = lazy(() => import('../scene/PcScene'))

type Tab = 'componenti' | 'scena' | 'riepilogo'

function Caricamento() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="flex flex-col items-center gap-3 text-mut">
        <div className="h-8 w-8 rounded-full border-2 border-white/10 border-t-cy anim-spin" />
        <span className="text-[12px]">Preparo la scena 3D…</span>
      </div>
    </div>
  )
}

function SenzaProgetto() {
  const apri = useStore((s) => s.apriModale)
  const projects = useStore((s) => s.projects)
  const setAttivo = useStore((s) => s.setAttivo)
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-16">
      <Vuoto
        icona={<Box size={26} />}
        titolo={projects.length ? 'Scegli un progetto da aprire' : 'Non hai ancora nessun progetto'}
        testo={projects.length ? 'Apri uno dei tuoi progetti oppure creane uno nuovo con il pulsante «+» in alto a destra.' : 'Crea il tuo primo PC: parti da zero oppure da uno dei 20 preset pronti, e guardalo prendere forma in 3D.'}
        azione={
          <div className="flex flex-wrap justify-center gap-2">
            <Bottone variante="primario" onClick={() => apri('nuovo', true)}>
              <Plus size={15} /> Nuovo progetto
            </Bottone>
            <Bottone onClick={() => apri('preset', true)}>
              <Sparkles size={15} /> Usa un preset
            </Bottone>
          </div>
        }
      />
      {projects.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {projects.map((p) => (
            <button key={p.id} type="button" onClick={() => setAttivo(p.id)} className="flex items-center gap-3 rounded-xl glass-solid p-3 text-left transition-colors hover:border-cy/40">
              <FolderOpen size={18} className="text-cy" />
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-txt">{p.nome}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function MenuAltro({ children }: { children: (chiudi: () => void) => React.ReactNode }) {
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
  return (
    <div ref={ref} className="relative">
      <Bottone piccolo onClick={() => setAperto((v) => !v)} aria-haspopup="menu" aria-expanded={aperto}>
        <MoreHorizontal size={14} /> <span className="hidden sm:inline">Altro</span>
      </Bottone>
      {aperto && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#0b1534] p-1 shadow-2xl anim-fade">
          {children(() => setAperto(false))}
        </div>
      )}
    </div>
  )
}

function VoceMenu({ icona: I, children, onClick, pericolo }: { icona: typeof Copy; children: React.ReactNode; onClick: () => void; pericolo?: boolean }) {
  return (
    <button type="button" role="menuitem" onClick={onClick} className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[12.5px] transition-colors hover:bg-white/[0.06] ${pericolo ? 'text-rd' : 'text-txt'}`}>
      <I size={14} className={pericolo ? '' : 'text-mut'} /> {children}
    </button>
  )
}

export default function ProgettoPc() {
  const p = useProgettoAttivo()
  const a = useAnalisi()
  const projects = useStore((s) => s.projects)
  const setAttivo = useStore((s) => s.setAttivo)
  const rinomina = useStore((s) => s.rinomina)
  const salva = useStore((s) => s.salva)
  const apri = useStore((s) => s.apriModale)
  const duplica = useStore((s) => s.duplicaProgetto)
  const resetBuild = useStore((s) => s.resetBuild)
  const chiediConferma = useStore((s) => s.chiediConferma)
  const toast = useStore((s) => s.toast)
  const categoria = useStore((s) => s.categoria)
  const setMiniatura = useStore((s) => s.setMiniatura)
  const setGpuVerticale = useStore((s) => s.setGpuVerticale)
  const [tab, setTab] = useState<Tab>(() => (typeof window !== 'undefined' && window.innerWidth < 1024 ? 'componenti' : 'scena'))
  const [rgbAperto, setRgbAperto] = useState(false)
  const largo = useMediaQuery('(min-width: 1024px)')
  const [nome, setNome] = useState(p?.nome ?? '')
  const idRef = useRef(p?.id)

  useEffect(() => {
    if (p && idRef.current !== p.id) idRef.current = p.id
    setNome(p?.nome ?? '')
  }, [p?.id, p?.nome]) // eslint-disable-line react-hooks/exhaustive-deps

  // miniatura automatica del progetto dopo ogni modifica
  const sel = p?.sel
  const rgb = p?.rgb
  const vert = p?.gpuVerticale
  const pid = p?.id
  useEffect(() => {
    if (!pid) return
    const t = setTimeout(() => {
      const url = catturaMiniatura()
      if (url) setMiniatura(pid, url)
    }, 2600)
    return () => clearTimeout(t)
  }, [pid, sel, rgb, vert, setMiniatura])

  useEffect(
    () => () => {
      const url = catturaMiniatura()
      if (url && idRef.current) useStore.getState().setMiniatura(idRef.current, url)
      sceneApi.gl = null
    },
    [],
  )

  if (!p || !a) return <SenzaProgetto />

  const caseSel = trova(p.sel.case)
  const supportaVerticale = !!caseSel && ex.b(caseSel, 'gpuVerticale')
  const m = META[categoria]
  const cambiaNome = () => (nome.trim() ? rinomina(p.id, nome) : setNome(p.nome))

  const Tabs = (
    <div className="grid grid-cols-3 border-b border-white/[0.06] bg-ant/80 lg:hidden" role="tablist">
      {([['componenti', 'Componenti', LayoutGrid], ['scena', 'Anteprima 3D', Box], ['riepilogo', 'Riepilogo', Layers3]] as const).map(([id, nome, I]) => (
        <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`flex items-center justify-center gap-1.5 border-b-2 py-2.5 text-[12.5px] font-medium transition-colors ${tab === id ? 'border-cy text-cy' : 'border-transparent text-mut'}`}>
          <I size={15} /> {nome}
          {id === 'riepilogo' && a.critici + a.attenzioni > 0 && <span className={`h-2 w-2 rounded-full ${a.critici ? 'bg-rd' : 'bg-am'}`} />}
        </button>
      ))}
    </div>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ---------------------------------------------------- barra superiore */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-y border-white/[0.06] bg-ant/80 px-3 py-2 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
          <label htmlFor="sel-progetto" className="sr-only">Progetto attivo</label>
          <select id="sel-progetto" value={p.id} onChange={(e) => setAttivo(e.target.value)} className={`${projects.length > 1 ? '' : 'hidden sm:block'} max-w-[120px] rounded-lg border border-white/[0.1] bg-obs px-2 py-1.5 text-[12px] text-txt sm:max-w-[190px]`}>
            {projects.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nome}
              </option>
            ))}
          </select>
          <input aria-label="Nome del progetto" value={nome} maxLength={60} onChange={(e) => setNome(e.target.value)} onBlur={cambiaNome} onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget.blur())} className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-[14px] font-semibold text-txt transition-colors hover:border-white/10 focus:border-cy/50 focus:bg-obs sm:w-52 sm:flex-none" />
          {!p.salvato && <span className="hidden text-[11px] text-am sm:inline">● Non salvato</span>}
        </div>
        <div className="order-3 flex w-full flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] sm:order-none sm:w-auto sm:gap-x-3">
          <Badge tono={tonoBuild(a.stato)}>{a.stato}</Badge>
          <span className="text-mut">
            <b className="tabular-nums text-txt">{a.numComponenti}</b> component{a.numComponenti === 1 ? 'e' : 'i'}
          </span>
          <span className="font-semibold tabular-nums text-txt">{euro(a.prezzo)}</span>
          <span className="tabular-nums text-mut">{a.tel.carico} W</span>
          {!p.salvato && <span className="text-[11px] text-am sm:hidden">● Non salvato</span>}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <Bottone piccolo onClick={salva} variante={p.salvato ? 'secondario' : 'successo'} aria-label="Salva il progetto">
            <Save size={13} /> <span className="hidden sm:inline">{p.salvato ? 'Salvata' : 'Salva'}</span>
          </Bottone>
          <Bottone piccolo variante="primario" onClick={() => apri('esporta', true)} title="Esporta la tua build in immagine, PDF o testo">
            <Download size={13} /> <span className="hidden sm:inline">Esporta</span>
          </Bottone>
          <MenuAltro>
            {(chiudi) => (
              <>
                <VoceMenu icona={Sparkles} onClick={() => { chiudi(); apri('preset', true) }}>Parti da un PC pronto</VoceMenu>
                <VoceMenu icona={Link2} onClick={async () => { chiudi(); toast((await copiaTesto(linkCondivisione(p))) ? 'successo' : 'errore', 'Link di condivisione copiato negli appunti.') }}>Copia link di condivisione</VoceMenu>
                <VoceMenu icona={Copy} onClick={() => { chiudi(); duplica(p.id) }}>Duplica il progetto</VoceMenu>
                <VoceMenu icona={RotateCcw} pericolo onClick={() => { chiudi(); chiediConferma({ titolo: 'Azzerare la build?', testo: `Tutti i componenti di "${p.nome}" verranno rimossi. L'operazione non può essere annullata.`, etichetta: 'Azzera build', pericolo: true, onOk: resetBuild }) }}>Ricomincia da zero</VoceMenu>
              </>
            )}
          </MenuAltro>
        </div>
      </div>

      {Tabs}

      {/* --------------------------------------------------------- 3 colonne */}
      <div className="grid min-h-0 flex-1 lg:grid-cols-[340px_minmax(0,1fr)_330px] xl:grid-cols-[380px_minmax(0,1fr)_340px]">
        {/* sinistra: categorie e catalogo */}
        <section aria-label="Catalogo componenti" className={`${tab === 'componenti' ? 'flex' : 'hidden'} min-h-0 flex-col border-r border-white/[0.06] bg-ant/60 px-3 pb-0 pt-3 lg:flex`}>
          <ElencoPassi />
          <div className="mt-3">
            <BannerGuida onVaiAlRiepilogo={() => setTab('riepilogo')} />
          </div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-1.5 text-[12.5px] font-semibold text-txt">
              <m.icona size={14} className="text-cy" /> {m.etichetta}
            </h3>
            <Badge tono={tonoCategoria(a.statiCategoria[categoria])}>{a.statiCategoria[categoria]}</Badge>
          </div>
          {categoria === 'gpu' && p.sel.gpu && (
            <div className="mb-2 rounded-lg border border-white/[0.06] bg-obs/50 px-3 py-1">
              <Interruttore etichetta="Montaggio verticale" descrizione={supportaVerticale ? 'Ventole rivolte verso il vetro' : 'Il case scelto non lo supporta'} attivo={p.gpuVerticale && supportaVerticale} onChange={(v) => (supportaVerticale ? setGpuVerticale(v) : toast('avviso', 'Il case selezionato non supporta il montaggio verticale della GPU.'))} />
            </div>
          )}
          <Catalogo cat={categoria} compatto />
        </section>

        {/* centro: scena 3D */}
        <section aria-label="Anteprima 3D" className={`${tab === 'scena' ? 'block' : 'hidden'} relative min-h-[360px] bg-obs lg:block`}>
          {/* sul telefono la scena 3D esiste solo quando la scheda è visibile: meno batteria e più fluidità */}
          {(largo || tab === 'scena') && (
            <Suspense fallback={<Caricamento />}>
              <div className="absolute inset-0">
                <PcScene progetto={p} />
              </div>
            </Suspense>
          )}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(10,10,12,0.55)_100%)]" />
          <BarraCamera onRgb={() => setRgbAperto((v) => !v)} rgbAperto={rgbAperto} />
          {rgbAperto && <PannelloRgb onClose={() => setRgbAperto(false)} />}
          {!p.sel.case && (
            <div className="pointer-events-none absolute inset-x-0 bottom-16 z-10 flex justify-center px-4">
              <div className="glass rounded-xl px-4 py-2.5 text-center text-[12.5px] text-mut anim-fade">
                Inizia scegliendo un <b className="text-txt">case</b>: il tuo PC apparirà qui e crescerà a ogni componente.
              </div>
            </div>
          )}
          <p className="pointer-events-none absolute bottom-3 right-4 hidden text-[11px] text-mut/80 sm:block">Trascina per ruotare · Rotellina per lo zoom · Tasto destro per spostare</p>
        </section>

        {/* destra: riepilogo, telemetria, compatibilità */}
        <section aria-label="Riepilogo build" className={`${tab === 'riepilogo' ? 'block' : 'hidden'} min-h-0 border-l border-white/[0.06] bg-ant/60 lg:block`}>
          <PannelloDestro a={a} onEsporta={() => apri('esporta', true)} />
        </section>
      </div>
    </div>
  )
}
