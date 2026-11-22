import { Apple, Check, CheckCircle2, Copy, Download, Laptop, Monitor, RefreshCw, Smartphone, Tablet } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { BUILD_APP, VERSIONE_APP, aggiornaOra, useAggiornamenti } from '../lib/aggiornamenti'
import { dataOraIt } from '../lib/format'
import { useInstallazione } from '../lib/pwa'
import { useStore } from '../store/useStore'
import { Bottone } from '../ui/base'
import { MessaggioAggiornamenti, linkScarica } from '../ui/Aggiornamenti'

type Sistema = 'android' | 'ios' | 'windows' | 'mac' | 'linux' | 'chromeos'

function riconosci(): Sistema | null {
  const ua = navigator.userAgent
  if (/android/i.test(ua)) return 'android'
  if (/iphone|ipad|ipod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return 'ios'
  if (/CrOS/i.test(ua)) return 'chromeos'
  if (/windows/i.test(ua)) return 'windows'
  if (/mac os x|macintosh/i.test(ua)) return 'mac'
  if (/linux|x11/i.test(ua)) return 'linux'
  return null
}

interface Scheda {
  id: Sistema
  nome: string
  sotto: string
  icona: ReactNode
  passi: ReactNode[]
}

const SCHEDE: Scheda[] = [
  {
    id: 'android',
    nome: 'Telefono o tablet Android',
    sotto: 'con Chrome',
    icona: <Smartphone size={22} />,
    passi: [
      <>Apri questo sito con <b>Chrome</b>.</>,
      <>Tocca i <b>tre puntini</b> in alto a destra.</>,
      <>Scegli <b>Installa app</b> (o «Aggiungi a schermata Home»).</>,
    ],
  },
  {
    id: 'ios',
    nome: 'iPhone e iPad',
    sotto: 'con Safari',
    icona: <Tablet size={22} />,
    passi: [
      <>Apri questo sito con <b>Safari</b> (non con altri browser).</>,
      <>Tocca <b>Condividi</b>, il quadrato con la freccia in su.</>,
      <>Scegli <b>Aggiungi alla schermata Home</b>, poi <b>Aggiungi</b>.</>,
    ],
  },
  {
    id: 'windows',
    nome: 'Computer Windows',
    sotto: 'con Edge o Chrome',
    icona: <Monitor size={22} />,
    passi: [
      <>Apri questo sito con <b>Edge</b> o <b>Chrome</b>.</>,
      <>Nella barra dell’indirizzo clicca l’icona <b>Installa</b> (un monitor con una freccia), oppure menu <b>⋯ → App → Installa</b>.</>,
      <>Conferma con <b>Installa</b>: trovi l’app nel menu Start.</>,
    ],
  },
  {
    id: 'mac',
    nome: 'Mac',
    sotto: 'con Safari, Chrome o Edge',
    icona: <Apple size={22} />,
    passi: [
      <>Con <b>Chrome</b> o <b>Edge</b>: clicca l’icona <b>Installa</b> nella barra dell’indirizzo.</>,
      <>Con <b>Safari</b>: menu <b>File → Aggiungi al Dock</b>.</>,
      <>L’app compare nel Launchpad e nel Dock.</>,
    ],
  },
  {
    id: 'linux',
    nome: 'Linux',
    sotto: 'con Chrome, Chromium o Edge',
    icona: <Laptop size={22} />,
    passi: [
      <>Apri questo sito con <b>Chrome</b>, <b>Chromium</b> o <b>Edge</b>.</>,
      <>Clicca l’icona <b>Installa</b> nella barra dell’indirizzo (o menu <b>⋮ → Installa</b>).</>,
      <>L’app compare tra le applicazioni del computer.</>,
    ],
  },
  {
    id: 'chromeos',
    nome: 'Chromebook',
    sotto: 'con Chrome',
    icona: <Laptop size={22} />,
    passi: [
      <>Apri questo sito con <b>Chrome</b>.</>,
      <>Clicca l’icona <b>Installa</b> nella barra dell’indirizzo.</>,
      <>L’app compare nel menu delle applicazioni.</>,
    ],
  },
]

export default function Scarica() {
  const { installata, puoiInstallare, installa } = useInstallazione()
  const { stato, nuova, controlla } = useAggiornamenti()
  const toast = useStore((s) => s.toast)
  const [mio] = useState<Sistema | null>(() => riconosci())
  const [copiato, setCopiato] = useState(false)
  const [lavoro, setLavoro] = useState(false)

  useEffect(() => {
    void controlla()
  }, [controlla])

  const ordine = mio ? [...SCHEDE.filter((s) => s.id === mio), ...SCHEDE.filter((s) => s.id !== mio)] : SCHEDE

  const copia = async () => {
    try {
      await navigator.clipboard.writeText(linkScarica())
      setCopiato(true)
      setTimeout(() => setCopiato(false), 2200)
    } catch {
      toast('info', `Copia questo indirizzo: ${linkScarica()}`)
    }
  }

  const disponibile = stato === 'disponibile'

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 pb-20 pt-4 sm:px-8">
      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-cy">Scarica</p>
      <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-txt sm:text-[34px]">Porta l’app con te</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-mut">Installa «Componi il tuo PC» sul telefono, sul tablet o sul computer: icona sullo schermo, schermo intero e uso anche senza internet.</p>

      <MessaggioAggiornamenti className="mt-5" />

      {/* ----------------------------------------------------- aggiornamento */}
      <section aria-label="Aggiornamenti" className={`mt-5 rounded-2xl border p-5 ${disponibile ? 'border-cy/50 bg-cy/[0.07]' : 'border-white/[0.08] glass-solid'}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold text-txt">Aggiornamenti</h2>
            <p className="mt-1 text-[13.5px] text-mut">
              La tua versione: <b className="text-txt">{VERSIONE_APP}</b>
              <span className="text-mut"> · pubblicata il {dataOraIt(BUILD_APP)}</span>
            </p>
            <p className="mt-2 flex items-center gap-2 text-[14px] font-medium" role="status" aria-live="polite">
              {stato === 'controllo' && (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/15 border-t-cy anim-spin" aria-hidden="true" /> <span className="text-mut">Controllo se ci sono novità…</span>
                </>
              )}
              {stato === 'ok' && (
                <>
                  <CheckCircle2 size={17} className="text-em" /> <span className="text-txt">Sei aggiornato: hai l’ultima versione.</span>
                </>
              )}
              {stato === 'disponibile' && (
                <>
                  <RefreshCw size={16} className="text-cy" /> <span className="text-txt">C’è una nuova versione{nuova ? ` (${nuova.versione})` : ''}: premi «Aggiorna ora».</span>
                </>
              )}
              {stato === 'offline' && <span className="text-mut">Sei offline: non posso controllare. Riprova con internet.</span>}
              {stato === 'sviluppo' && <span className="text-mut">Versione di sviluppo: il controllo funziona sul sito pubblicato.</span>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Bottone onClick={() => void controlla()} disabled={stato === 'controllo'}>
              <RefreshCw size={14} /> Controlla aggiornamenti
            </Bottone>
            <Bottone
              variante="primario"
              disabled={lavoro}
              onClick={() => {
                setLavoro(true)
                void aggiornaOra()
              }}
            >
              <Download size={14} /> {lavoro ? 'Aggiorno…' : 'Aggiorna ora'}
            </Bottone>
          </div>
        </div>
        <p className="mt-3 text-[12.5px] leading-snug text-mut">«Aggiorna ora» scarica dal sito l’ultima versione e riapre l’app. I tuoi progetti e il tuo profilo restano salvati.</p>
      </section>

      {/* ----------------------------------------------------- installazione */}
      <h2 className="mt-9 text-[19px] font-semibold text-txt">Come installare l’app</h2>
      {installata ? (
        <p className="mt-2 flex items-center gap-2 rounded-xl border border-em/30 bg-em/10 px-4 py-3 text-[14px] text-txt">
          <CheckCircle2 size={17} className="text-em" /> Stai già usando l’app installata su questo dispositivo.
        </p>
      ) : (
        puoiInstallare && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-cy/40 bg-cy/[0.08] p-4">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-txt">Installa su questo dispositivo</p>
              <p className="text-[13px] text-mut">Un tocco e l’app è sul tuo schermo.</p>
            </div>
            <Bottone variante="primario" onClick={async () => ((await installa()) ? toast('successo', 'App installata! La trovi tra le tue app.') : undefined)}>
              <Download size={15} /> Installa ora
            </Bottone>
          </div>
        )
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {ordine.map((s) => (
          <section key={s.id} aria-label={s.nome} className={`rounded-2xl border p-5 ${s.id === mio ? 'border-cy/40 bg-cy/[0.05]' : 'border-white/[0.08] glass-solid'}`}>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/[0.07] text-cy">{s.icona}</span>
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold leading-tight text-txt">{s.nome}</h3>
                <p className="text-[12.5px] text-mut">{s.sotto}</p>
              </div>
              {s.id === mio && <span className="ml-auto rounded-full bg-cy px-2.5 py-0.5 text-[11px] font-semibold text-obs">Il tuo dispositivo</span>}
            </div>
            <ol className="mt-4 space-y-2.5">
              {s.passi.map((p, i) => (
                <li key={i} className="flex gap-3 text-[13.5px] leading-snug text-txt">
                  <span className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/10 text-[11px] font-bold">{i + 1}</span>
                  <span>{p}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-white/[0.08] glass-solid p-5" aria-label="Link da condividere">
        <h3 className="text-[15px] font-semibold text-txt">Vuoi installarla su un altro dispositivo?</h3>
        <p className="mt-1 text-[13.5px] text-mut">Copia questo link e aprilo sull’altro telefono o computer: arrivi direttamente qui.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-lg border border-white/[0.1] bg-obs px-3 py-2.5 text-[12.5px] text-txt">{linkScarica()}</code>
          <Bottone onClick={() => void copia()}>{copiato ? <><Check size={14} /> Copiato</> : <><Copy size={14} /> Copia link</>}</Bottone>
        </div>
      </section>

      <p className="mt-6 text-[12.5px] leading-relaxed text-mut">
        Come funziona: l’app è la stessa del sito, installata dal browser. Non c’è nessun file da scaricare e non serve alcun negozio di app. Per questo si aggiorna solo da qui, dal sito.
      </p>
    </div>
  )
}
