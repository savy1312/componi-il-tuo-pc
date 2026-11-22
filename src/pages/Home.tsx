import { ArrowRight, CheckCircle2, Layers3, ListChecks, Sparkles, Wand2 } from 'lucide-react'
import { PRESET } from '../data/presets'
import { HARDWARE } from '../data/hardware'
import { analizza } from '../engine/compat'
import { euro } from '../lib/format'
import { useInstallazione } from '../lib/pwa'
import { useStore } from '../store/useStore'
import { Badge, tonoBuild } from '../ui/base'
import { useEffect, useMemo, useRef, useState } from 'react'

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_215831_c6a8989c-d716-4d8d-8745-e972a2eec711.mp4'

const PASSI = [
  { n: '1', t: 'Scegli un punto di partenza', d: 'Parti da un PC già pronto oppure da zero: puoi cambiare tutto quando vuoi.' },
  { n: '2', t: 'Segui i passi numerati', d: 'Ti guidiamo dal case fino all’alimentatore, spiegando in parole semplici a cosa serve ogni pezzo. Se non sai cosa scegliere, premi «Scegli per me».' },
  { n: '3', t: 'Guardalo in 3D ed esportalo', d: 'Ogni componente compare subito nel PC virtuale. Gli errori di compatibilità ti vengono segnalati in automatico. Alla fine salvi, condividi o esporti.' },
]

/** Illustrazione di riserva quando il video non può essere caricato (rete lenta, risparmio dati, blocchi). */
function SfondoRiserva() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_50%_30%,#ffffff_0%,#e9ebef_55%,#dfe2e8_100%)]" aria-hidden="true">
      <svg viewBox="0 0 400 420" className="absolute left-1/2 top-[11%] h-[38%] max-h-[420px] -translate-x-1/2 drop-shadow-[0_30px_40px_rgba(15,23,42,0.25)] sm:top-[8%] sm:h-[58%]" fill="none">
        <defs>
          <linearGradient id="vetro" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2a2f3a" />
            <stop offset="1" stopColor="#12141a" />
          </linearGradient>
          <radialGradient id="luce" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#22d3ee" stopOpacity="0.55" />
            <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="90" y="20" width="220" height="360" rx="18" fill="#1b1d24" stroke="#c8ccd4" strokeWidth="3" />
        <rect x="104" y="34" width="192" height="262" rx="10" fill="url(#vetro)" stroke="#22d3ee" strokeOpacity="0.5" />
        <circle cx="200" cy="120" r="90" fill="url(#luce)" />
        {[96, 176, 256].map((y) => (
          <g key={y} transform={`translate(262 ${y - 10})`}>
            <circle r="30" stroke="#22d3ee" strokeWidth="3" />
            <circle r="5" fill="#e5e7eb" />
            {[0, 72, 144, 216, 288].map((a) => (
              <path key={a} d="M0 0 Q 16 -8 26 -20" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" transform={`rotate(${a})`} />
            ))}
          </g>
        ))}
        <rect x="128" y="64" width="64" height="44" rx="6" fill="#0f1116" stroke="#475569" />
        <rect x="136" y="72" width="48" height="28" rx="3" fill="#334155" />
        <rect x="128" y="130" width="86" height="34" rx="6" fill="#0f1116" stroke="#475569" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={138 + i * 14} y="138" width="8" height="18" rx="2" fill="#22d3ee" opacity="0.85" />
        ))}
        <rect x="124" y="196" width="130" height="30" rx="8" fill="#0f1116" stroke="#475569" />
        <rect x="104" y="306" width="192" height="60" rx="8" fill="#14161c" stroke="#2f3541" />
        <rect x="120" y="322" width="90" height="10" rx="3" fill="#2f3541" />
        <rect x="116" y="380" width="20" height="14" rx="4" fill="#9aa1ad" />
        <rect x="264" y="380" width="20" height="14" rx="4" fill="#9aa1ad" />
      </svg>
    </div>
  )
}

export default function Home() {
  const [videoKo, setVideoKo] = useState(false)
  const video = useRef<HTMLVideoElement>(null)
  // se dopo qualche secondo il video non è partito (rete lenta o bloccato) mostra l'illustrazione
  useEffect(() => {
    const t = setTimeout(() => {
      const v = video.current
      if (!v || v.readyState < 2) setVideoKo(true)
    }, 4000)
    return () => clearTimeout(t)
  }, [])

  const vai = useStore((s) => s.vai)
  const apri = useStore((s) => s.apriModale)
  const creaProgetto = useStore((s) => s.creaProgetto)
  const projects = useStore((s) => s.projects)
  const { puoiInstallare, installa } = useInstallazione()
  const vetrina = useMemo(() => PRESET.slice(0, 6).map((x) => ({ x, a: analizza(x.sel) })), [])

  return (
    <div className="bg-obs">
      {/* ---------------------------------------------------------- hero */}
      <div className="relative min-h-screen overflow-hidden bg-[#f0f0ee]">
        {videoKo && <SfondoRiserva />}
        <video ref={video} className={`absolute inset-0 w-full h-full object-cover ${videoKo ? 'hidden' : ''}`} src={VIDEO_URL} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" onError={() => setVideoKo(true)} />

        <div className="relative z-10 flex flex-col min-h-screen">
          <div className="h-[72px] sm:h-[84px]" aria-hidden="true" />

          <div className="flex-1 flex items-end pb-10 sm:pb-16 lg:pb-20 px-6 sm:px-12 md:px-20 lg:px-28">
            <div className="max-w-xs">
              <button type="button" onClick={() => vai('componenti')} className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-blue-500 hover:text-blue-600 transition-colors mb-3 group">
                Oltre {HARDWARE.length} componenti con compatibilità automatica
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </button>

              <h1 className="text-[1.5rem] sm:text-[1.75rem] leading-[1.15] font-medium text-gray-900 tracking-tight mb-3">Componi il tuo PC ideale e guardalo prendere forma in 3D.</h1>

              <p className="text-[13px] text-gray-400 font-normal mb-3">Scegli ogni pezzo, controlla la compatibilità e condividi la tua build.</p>

              <button
                type="button"
                onClick={() => (projects.length ? vai('pc') : apri('nuovo', true))}
                className="inline-flex items-center gap-2 text-[13px] font-medium text-blue-500 border border-blue-400 rounded-full px-5 py-2.5 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all duration-200 group"
              >
                {projects.length ? 'Continua il tuo progetto' : 'Inizia a comporre'}
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </button>
              <button type="button" onClick={() => apri('preset', true)} className="ml-2 mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-gray-500 underline-offset-4 hover:text-gray-900 hover:underline">
                oppure parti da un PC pronto
              </button>
              {puoiInstallare && (
                <button type="button" onClick={installa} className="mt-3 block text-[12.5px] font-medium text-gray-500 underline-offset-4 hover:text-gray-900 hover:underline">
                  Installa l’app sul telefono
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

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

      <footer className="border-t border-white/[0.05] px-5 py-8 text-center text-[11.5px] leading-relaxed text-mut sm:px-8">
        <p>Componi il tuo PC · Prezzi e specifiche sono indicativi e possono variare. Marchi e nomi appartengono ai rispettivi proprietari.</p>
        <p className="mt-1">I tuoi progetti sono salvati solo su questo dispositivo.</p>
      </footer>
    </div>
  )
}
