import { ArrowRight, CheckCircle2, Download, Layers3, ListChecks, ShieldCheck, Sparkles, Wand2 } from 'lucide-react'
import { PRESET } from '../data/presets'
import { HARDWARE } from '../data/hardware'
import { analizza } from '../engine/compat'
import { euro } from '../lib/format'
import { MessaggioAggiornamenti } from '../ui/Aggiornamenti'
import { useStore } from '../store/useStore'
import { Badge, tonoBuild } from '../ui/base'
import { Component, lazy, Suspense, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { StatoHero } from '../scene/HeroPc'

const PASSI = [
  { n: '1', t: 'Scegli un punto di partenza', d: 'Parti da un PC già pronto oppure da zero: puoi cambiare tutto quando vuoi.' },
  { n: '2', t: 'Segui i passi numerati', d: 'Ti guidiamo dal case fino all’alimentatore, spiegando in parole semplici a cosa serve ogni pezzo. Se non sai cosa scegliere, premi «Scegli per me».' },
  { n: '3', t: 'Guardalo in 3D ed esportalo', d: 'Ogni componente compare subito nel PC virtuale. Gli errori di compatibilità ti vengono segnalati in automatico. Alla fine salvi, condividi o esporti.' },
]

const HeroPc = lazy(() => import('../scene/HeroPc'))

/** Se il 3D non può partire (dispositivo molto vecchio) mostra un'illustrazione al suo posto. */
class ProteggiHero extends Component<{ children: ReactNode }, { ko: boolean }> {
  state = { ko: false }
  static getDerivedStateFromError() {
    return { ko: true }
  }
  render() {
    return this.state.ko ? <Illustrazione /> : this.props.children
  }
}

function Illustrazione() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <img src="icons/icon-512.png" alt="Un PC in 3D con i suoi componenti" className="w-[62%] max-w-[360px] rounded-[22%] shadow-[0_30px_80px_-20px_rgba(34,211,238,0.5)]" />
    </div>
  )
}

const MESSAGGI: Record<StatoHero['fase'], string> = {
  assembla: 'Ecco un PC: guarda come si monta…',
  smonta: 'Lo smontiamo, per farti vedere ogni pezzo',
  tour: '',
  rimonta: 'Ora lo rimontiamo…',
  gira: 'Pronto!',
  fine: 'Questo è un PC completo. Ora tocca a te: componi il tuo!',
}

function DidascaliaHero({ s }: { s: StatoHero }) {
  const passo = s.fase === 'tour' && s.info
  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex justify-center sm:inset-x-6 sm:bottom-6" aria-live="polite">
      <div key={passo ? s.passo : s.fase} className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1534]/80 p-4 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8)] backdrop-blur-md anim-pop">
        {passo && s.info ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-cy">
                Componente {s.passo + 1} di {s.totale}
              </p>
              <div className="flex gap-1" aria-hidden="true">
                {Array.from({ length: s.totale }, (_, i) => (
                  <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === s.passo ? 'w-4 bg-cy' : i < s.passo ? 'w-1.5 bg-cy/50' : 'w-1.5 bg-white/20'}`} />
                ))}
              </div>
            </div>
            <h2 className="mt-1.5 text-[17px] font-semibold leading-tight text-txt">{s.info.titolo}</h2>
            <p className="mt-0.5 text-[12.5px] font-medium text-cy/90">{s.info.nome}</p>
            <p className="mt-1 text-[13px] leading-snug text-mut">{s.info.testo}</p>
          </>
        ) : (
          <p className="text-center text-[14px] font-medium text-txt">{MESSAGGI[s.fase]}</p>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  const vai = useStore((s) => s.vai)
  const apri = useStore((s) => s.apriModale)
  const projects = useStore((s) => s.projects)
  const creaProgetto = useStore((s) => s.creaProgetto)
  const vetrina = useMemo(() => PRESET.slice(0, 6).map((x) => ({ x, a: analizza(x.sel) })), [])
  const [hero, setHero] = useState<StatoHero>({ fase: 'assembla', passo: 0, totale: 10 })

  return (
    <div>
      {/* ---------------------------------------------------------- hero */}
      <section className="relative isolate overflow-hidden bg-[#071029]" aria-label="Presentazione">
        <div className="pointer-events-none absolute -left-40 top-10 h-[480px] w-[480px] rounded-full bg-cy/10 blur-[120px]" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-32 top-0 h-[520px] w-[520px] rounded-full bg-ind/20 blur-[130px]" aria-hidden="true" />

        <div className="mx-auto grid min-h-[100svh] max-w-7xl grid-rows-[auto_auto] items-center gap-0 px-0 pt-[76px] sm:pt-[92px] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-1 lg:pt-0">
          {/* 3D */}
          <div className="relative order-1 h-[56svh] min-h-[340px] lg:order-2 lg:h-[100svh]">
            <ProteggiHero>
              <Suspense
                fallback={
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="h-9 w-9 rounded-full border-2 border-white/10 border-t-cy anim-spin" role="status" aria-label="Preparo il PC in 3D" />
                  </div>
                }
              >
                <div className="absolute inset-0">
                  <HeroPc onStato={setHero} />
                </div>
              </Suspense>
            </ProteggiHero>
            <DidascaliaHero s={hero} />
          </div>

          {/* testo */}
          <div className="relative z-10 order-2 px-5 pb-12 pt-6 sm:px-10 lg:order-1 lg:px-12 lg:pb-0 lg:pt-24">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-cy/30 bg-cy/10 px-3 py-1 text-[12px] font-medium text-cy">
              <ShieldCheck size={13} /> Gratis · senza registrazione
            </p>
            <h1 className="mt-4 text-[2rem] font-semibold leading-[1.1] tracking-tight text-txt sm:text-[2.6rem] lg:text-[3rem]">
              Costruisci il tuo PC,
              <span className="block bg-gradient-to-r from-cy to-ind bg-clip-text text-transparent">pezzo dopo pezzo, in 3D.</span>
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-mut">Ti guidiamo passo dopo passo, anche se non hai mai montato un PC. Controlliamo noi che tutto sia compatibile.</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => (projects.length ? vai('pc') : apri('nuovo', true))} className="inline-flex items-center gap-2 rounded-full bg-cy px-6 py-3.5 text-[15px] font-semibold text-obs shadow-[0_10px_40px_-10px_rgba(34,211,238,0.8)] transition-all hover:bg-[#5fe3f5] active:scale-[0.98]">
                {projects.length ? 'Continua il tuo progetto' : 'Inizia a comporre'} <ArrowRight size={17} />
              </button>
              <button type="button" onClick={() => apri('preset', true)} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3.5 text-[14px] font-medium text-txt transition-colors hover:border-cy/50 hover:text-cy">
                <Sparkles size={15} /> Parti da un PC pronto
              </button>
            </div>
            <button type="button" onClick={() => vai('scarica')} className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-mut underline-offset-4 hover:text-txt hover:underline">
              <Download size={14} /> Scarica l’app per telefono e computer
            </button>
            <ul className="mt-8 grid max-w-md grid-cols-3 gap-3 text-[12px] text-mut">
              {[
                ['1', 'Scegli i pezzi'],
                ['2', 'Guardalo in 3D'],
                ['3', 'Salva ed esporta'],
              ].map(([n, t]) => (
                <li key={n} className="flex items-center gap-2">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-[11px] font-bold text-txt">{n}</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-[#060c20]" aria-hidden="true" />
      </section>

      {/* ------------------------------------------------------ da dove iniziare */}
      <section className="mx-auto max-w-6xl px-5 pb-6 pt-16 sm:px-8" aria-labelledby="inizio">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-cy">Inizia in 10 secondi</p>
        <h2 id="inizio" className="mt-2 max-w-2xl text-[28px] font-semibold leading-tight tracking-tight text-txt sm:text-[36px]">
          Da dove vuoi partire?
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { i: Sparkles, t: 'Un PC già pronto', d: 'Scegli tra 20 configurazioni per gaming, lavoro e creatività. Le modifichi come vuoi.', az: 'Vedi i PC pronti', f: () => apri('preset', true), evid: true },
            { i: Wand2, t: 'Creo il mio PC da zero', d: 'Ti guidiamo passo dopo passo, dal case all’alimentatore, con consigli in italiano semplice.', az: 'Inizia ora', f: () => apri('nuovo', true) },
            { i: ListChecks, t: 'Voglio solo curiosare', d: `Sfoglia oltre ${HARDWARE.length} componenti, con filtri, confronto e dettagli.`, az: 'Apri il catalogo', f: () => vai('componenti') },
          ].map(({ i: I, t, d, az, f, evid }) => (
            <button key={t} type="button" onClick={f} className={`group flex flex-col items-start rounded-2xl border p-6 text-left transition-all duration-300 hover:-translate-y-1 ${evid ? 'border-cy/40 bg-gradient-to-br from-cy/[0.12] to-transparent hover:shadow-[0_0_40px_-14px_rgba(34,211,238,0.7)]' : 'border-white/[0.08] bg-ant/70 hover:border-cy/30'}`}>
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-cy/10 text-cy">
                <I size={24} />
              </span>
              <h3 className="mt-4 text-[17px] font-semibold text-txt">{t}</h3>
              <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-mut">{d}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-cy">
                {az} <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------ come funziona */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8" aria-labelledby="come">
        <h2 id="come" className="flex items-center gap-2 text-[20px] font-semibold tracking-tight text-txt">
          <Layers3 size={20} className="text-cy" /> Come funziona
        </h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {PASSI.map((p) => (
            <li key={p.n} className="flex gap-4 rounded-2xl glass-solid p-5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cy text-[15px] font-bold text-obs">{p.n}</span>
              <div>
                <h3 className="text-[15px] font-semibold text-txt">{p.t}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-mut">{p.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ----------------------------------------------------------- preset */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8" aria-labelledby="pre">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-cy">Preset pronti</p>
            <h2 id="pre" className="mt-2 text-[28px] font-semibold tracking-tight text-txt sm:text-[34px]">
              Oppure scegli una build già pronta.
            </h2>
          </div>
          <button type="button" onClick={() => apri('preset', true)} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-cy hover:underline">
            Vedi tutti i 20 preset <ArrowRight size={14} />
          </button>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vetrina.map(({ x, a }) => (
            <article key={x.id} className="flex flex-col rounded-2xl glass-solid p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cy/30">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[15px] font-semibold text-txt">{x.nome}</h3>
                <Badge tono="cy">{x.uso}</Badge>
              </div>
              <p className="mt-2 flex-1 text-[12.5px] leading-relaxed text-mut">{x.descrizione}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[16px] font-semibold tabular-nums text-txt">{euro(a.prezzo)}</span>
                <Badge tono={tonoBuild(a.stato)}>
                  <CheckCircle2 size={10} /> {a.stato.replace('Build ', '')}
                </Badge>
              </div>
              <button type="button" onClick={() => creaProgetto(x.nome, x.id)} className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-[12.5px] font-medium text-txt transition-colors hover:border-cy/40 hover:text-cy">
                <Sparkles size={13} /> Apri nel configuratore
              </button>
            </article>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-5 pb-8 sm:px-8">
        <MessaggioAggiornamenti />
      </div>

      <footer className="border-t border-white/[0.05] px-5 py-8 text-center text-[11.5px] leading-relaxed text-mut sm:px-8">
        <p>Componi il tuo PC · Prezzi e specifiche sono indicativi e possono variare. Marchi e nomi appartengono ai rispettivi proprietari.</p>
        <p className="mt-1">I tuoi progetti sono salvati solo su questo dispositivo.</p>
      </footer>
    </div>
  )
}
