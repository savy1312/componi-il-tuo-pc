import { AlertTriangle, ArrowLeftRight, Check, Clipboard, Copy, Download, FileJson, FileText, Film, Image as ImageIcon, Link2, Plus, RefreshCw, Save, Share2, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { META, specifiche, specChiave } from '../data/categorie'
import { trova } from '../data/hardware'
import { PRESET } from '../data/presets'
import ImgComponente from './ImgComponente'
import { alternative, analizza, selezioneVuota, valutaCandidato } from '../engine/compat'
import { costruisciJson, esportaImmagine, esportaJson, esportaPdf, registraVideo, riepilogoTesto, scaricaBlob, videoSupportato } from '../lib/export'
import { dataIt, euro } from '../lib/format'
import { useAnalisi } from '../lib/hooks'
import { copiaTesto, linkCondivisione } from '../lib/share'
import { useProgettoAttivo, useStore } from '../store/useStore'
import type { Componente } from '../types'
import { CATEGORIE_MULTIPLE } from '../types'
import { Badge, Bottone, Modale, etichettaGravita, tonoBuild, tonoGravita } from './base'
import { idsInCategoria } from './Catalogo'

/* --------------------------------------------------------------- conferma */

export function ModaleConferma() {
  const c = useStore((s) => s.conferma)
  const chiudi = useStore((s) => s.chiudiConferma)
  if (!c) return null
  return (
    <Modale
      titolo={c.titolo}
      onClose={chiudi}
      larghezza="max-w-md"
      piede={
        <>
          <Bottone onClick={chiudi}>Annulla</Bottone>
          <Bottone
            variante={c.pericolo ? 'pericolo' : 'primario'}
            onClick={() => {
              chiudi()
              c.onOk()
            }}
          >
            {c.etichetta}
          </Bottone>
        </>
      }
    >
      <div className="flex gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${c.pericolo ? 'bg-rd/10 text-rd' : 'bg-cy/10 text-cy'}`}>
          <AlertTriangle size={20} />
        </div>
        <div>
          <p className="text-[13.5px] leading-relaxed text-txt">{c.testo}</p>
          {c.dettagli && (
            <ul className="mt-2.5 space-y-1.5">
              {c.dettagli.map((d, i) => (
                <li key={i} className="rounded-lg bg-rd/[0.07] px-2.5 py-1.5 text-[12px] leading-snug text-rd">
                  {d}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modale>
  )
}

/* ------------------------------------------------------------ dettaglio */

export function ModaleDettaglio() {
  const id = useStore((s) => s.modali.dettaglio)
  const apri = useStore((s) => s.apriModale)
  const richiediAggiunta = useStore((s) => s.richiediAggiunta)
  const rimuovi = useStore((s) => s.rimuovi)
  const toggleConfronto = useStore((s) => s.toggleConfronto)
  const confronto = useStore((s) => s.confronto)
  const p = useProgettoAttivo()
  const c = trova(id ?? undefined)
  const sel = p?.sel ?? selezioneVuota()
  const esito = useMemo(() => (c ? valutaCandidato(sel, c) : null), [c, sel])
  const alt = useMemo(() => (c ? alternative(sel, c, 3) : []), [c, sel])
  if (!c || !esito) return null
  const dentro = idsInCategoria(sel, c.categoria).includes(c.id)
  const multi = CATEGORIE_MULTIPLE.includes(c.categoria)
  const chiudi = () => apri('dettaglio', null)

  return (
    <Modale
      titolo={c.nome}
      sottotitolo={`${META[c.categoria].etichetta} · ${c.marca}`}
      onClose={chiudi}
      larghezza="max-w-3xl"
      piede={
        <>
          <Bottone onClick={() => toggleConfronto(c.id)} className={confronto.includes(c.id) ? 'border-cy/50 text-cy' : ''}>
            <ArrowLeftRight size={14} /> {confronto.includes(c.id) ? 'Nel confronto' : 'Confronta'}
          </Bottone>
          {dentro ? (
            <Bottone
              variante="secondario"
              onClick={() => {
                rimuovi(c.categoria, c.id)
                chiudi()
              }}
            >
              <Trash2 size={14} /> Rimuovi dalla build
            </Bottone>
          ) : (
            <Bottone
              variante="primario"
              onClick={() => {
                richiediAggiunta(c)
                chiudi()
              }}
            >
              {multi ? <Plus size={14} /> : <Check size={14} />} {multi ? 'Aggiungi alla build' : idsInCategoria(sel, c.categoria).length ? 'Sostituisci nella build' : 'Seleziona'}
            </Bottone>
          )}
        </>
      }
    >
      <div className="grid gap-5 md:grid-cols-[220px_1fr]">
        <div>
          <ImgComponente c={c} className="aspect-[4/3] rounded-2xl border border-white/[0.06]" iconSize={56} />
          <p className="mt-3 text-[26px] font-semibold tabular-nums text-txt">{euro(c.prezzo)}</p>
          <p className="text-[11px] text-mut">Prezzo indicativo</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge tono="cy">{c.fascia}</Badge>
            <Badge>{c.valutazione}</Badge>
            {c.tag.map((t) => (
              <Badge key={t} tono={t === 'Premium' ? 'ind' : t === 'Best Value' ? 'em' : 'cy'}>
                {t}
              </Badge>
            ))}
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <p className="text-[13px] leading-relaxed text-mut">{c.descrizione}</p>
          <div
            className={`rounded-xl border px-3.5 py-3 ${esito.livello === 'critico' ? 'border-rd/30 bg-rd/[0.06]' : esito.livello === 'attenzione' ? 'border-am/30 bg-am/[0.06]' : 'border-em/25 bg-em/[0.06]'}`}
          >
            <p className={`text-[12.5px] font-semibold ${esito.livello === 'critico' ? 'text-rd' : esito.livello === 'attenzione' ? 'text-am' : 'text-em2'}`}>
              {esito.livello === 'critico' ? 'Non compatibile con la tua build' : esito.livello === 'attenzione' ? 'Compatibile con alcune attenzioni' : p ? 'Compatibile con la tua build' : 'Nessun conflitto rilevato'}
            </p>
            {esito.problemi.map((x) => (
              <p key={x.id} className="mt-1 text-[12px] leading-snug text-txt/90">
                • {x.messaggio}
              </p>
            ))}
          </div>
          <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
            {specifiche(c).map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-3 border-b border-white/[0.05] py-1.5">
                <dt className="text-[12px] text-mut">{k}</dt>
                <dd className="text-right text-[12.5px] font-medium text-txt">{v}</dd>
              </div>
            ))}
          </dl>
          {alt.length > 0 && (
            <div>
              <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-mut">Alternative compatibili</h3>
              <div className="grid gap-2 sm:grid-cols-3">
                {alt.map((a) => (
                  <button key={a.id} type="button" onClick={() => apri('dettaglio', a.id)} className="rounded-lg border border-white/[0.08] bg-ant/70 p-2.5 text-left transition-colors hover:border-cy/40">
                    <p className="line-clamp-2 text-[12px] font-medium leading-snug text-txt">{a.nome}</p>
                    <p className="mt-1 text-[11.5px] tabular-nums text-mut">{euro(a.prezzo)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modale>
  )
}

/* ------------------------------------------------------------ confronto */

export function ModaleConfronto() {
  const ids = useStore((s) => s.confronto)
  const apri = useStore((s) => s.apriModale)
  const toggle = useStore((s) => s.toggleConfronto)
  const svuota = useStore((s) => s.svuotaConfronto)
  const richiediAggiunta = useStore((s) => s.richiediAggiunta)
  const comp = ids.map((i) => trova(i)).filter(Boolean) as Componente[]
  const chiudi = () => apri('confronto', false)
  const righe = useMemo(() => {
    const chiavi: string[] = ['Prezzo']
    const mappe = comp.map((c) => {
      const m = new Map<string, string>([['Prezzo', euro(c.prezzo)]])
      specifiche(c).forEach(([k, v]) => {
        m.set(k, v)
        if (!chiavi.includes(k)) chiavi.push(k)
      })
      return m
    })
    return chiavi.map((k) => ({ k, v: mappe.map((m) => m.get(k) ?? '—') }))
  }, [comp])
  const minPrezzo = Math.min(...comp.map((c) => c.prezzo))

  return (
    <Modale
      titolo="Confronto componenti"
      sottotitolo={comp.length < 2 ? 'Seleziona almeno 2 componenti con il pulsante di confronto.' : 'Differenze evidenziate fra le specifiche principali.'}
      onClose={chiudi}
      larghezza="max-w-5xl"
      piede={
        <>
          <Bottone
            onClick={() => {
              svuota()
              chiudi()
            }}
          >
            <Trash2 size={14} /> Svuota confronto
          </Bottone>
          <Bottone variante="primario" onClick={chiudi}>
            Chiudi
          </Bottone>
        </>
      }
    >
      {comp.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-mut">Nessun componente nel confronto.</p>
      ) : (
        <div className="overflow-x-auto scroll-y">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr>
                <th className="w-40 p-2" />
                {comp.map((c) => (
                  <th key={c.id} className="p-2 align-top">
                    <div className="rounded-xl border border-white/[0.08] bg-ant/70 p-3">
                      <p className="text-[10.5px] uppercase tracking-wider text-mut">{c.marca}</p>
                      <p className="text-[13px] font-semibold leading-snug text-txt">{c.nome}</p>
                      <p className="mt-0.5 text-[11px] font-normal text-mut">{specChiave(c)}</p>
                      <div className="mt-2 flex gap-1.5">
                        <Bottone piccolo variante="primario" onClick={() => richiediAggiunta(c)}>
                          <Plus size={12} /> Aggiungi
                        </Bottone>
                        <Bottone piccolo variante="ghost" onClick={() => toggle(c.id)} aria-label={`Rimuovi ${c.nome} dal confronto`}>
                          <X size={13} />
                        </Bottone>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {righe.map((r) => {
                const diversi = new Set(r.v).size > 1
                return (
                  <tr key={r.k} className="border-t border-white/[0.05]">
                    <th scope="row" className="p-2 text-[12px] font-medium text-mut">
                      {r.k}
                    </th>
                    {r.v.map((v, i) => (
                      <td key={i} className={`p-2 text-[12.5px] ${diversi ? 'font-medium text-txt' : 'text-mut'} ${r.k === 'Prezzo' && comp[i].prezzo === minPrezzo && comp.length > 1 ? 'text-em2' : ''}`}>
                        {v}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Modale>
  )
}

/* ------------------------------------------------------- nuovo progetto */

export function ModaleNuovo() {
  const apri = useStore((s) => s.apriModale)
  const crea = useStore((s) => s.creaProgetto)
  const n = useStore((s) => s.projects.length)
  const [nome, setNome] = useState(`Il mio PC ${n + 1}`)
  const [preset, setPreset] = useState<string | undefined>()
  const chiudi = () => apri('nuovo', false)
  const invia = () => {
    crea(nome, preset)
    chiudi()
  }
  return (
    <Modale
      titolo="Nuovo progetto"
      sottotitolo="Dai un nome al progetto e scegli come iniziare. Potrai cambiare qualsiasi componente in seguito."
      onClose={chiudi}
      larghezza="max-w-3xl"
      piede={
        <>
          <Bottone onClick={chiudi}>Annulla</Bottone>
          <Bottone variante="primario" onClick={invia} disabled={!nome.trim()}>
            <Plus size={14} /> Crea progetto
          </Bottone>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (nome.trim()) invia()
        }}
      >
        <label htmlFor="nome-progetto" className="mb-1.5 block text-[12px] font-medium text-mut">
          Nome del progetto
        </label>
        <input id="nome-progetto" autoFocus value={nome} maxLength={60} onChange={(e) => setNome(e.target.value)} className="w-full rounded-lg border border-white/[0.1] bg-obs px-3 py-2.5 text-[14px] text-txt focus:border-cy/60" />
        <p className="mb-2 mt-5 text-[12px] font-medium text-mut">Come vuoi iniziare?</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => setPreset(undefined)} aria-pressed={!preset} className={`rounded-xl border p-3 text-left transition-colors ${!preset ? 'border-cy/60 bg-cy/10' : 'border-white/[0.08] hover:border-white/20'}`}>
            <p className="text-[13px] font-semibold text-txt">Da zero, con la guida</p>
            <p className="mt-0.5 text-[11.5px] text-mut">Ti accompagniamo passo dopo passo, dal case in poi.</p>
          </button>
          {PRESET.map((p) => (
            <button key={p.id} type="button" onClick={() => setPreset(p.id)} aria-pressed={preset === p.id} className={`rounded-xl border p-3 text-left transition-colors ${preset === p.id ? 'border-cy/60 bg-cy/10' : 'border-white/[0.08] hover:border-white/20'}`}>
              <p className="flex items-center justify-between gap-2 text-[13px] font-semibold text-txt">
                {p.nome} <Badge>{p.uso}</Badge>
              </p>
              <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-mut">{p.descrizione}</p>
            </button>
          ))}
        </div>
      </form>
    </Modale>
  )
}

/* --------------------------------------------------------------- preset */

export function ModalePreset() {
  const apri = useStore((s) => s.apriModale)
  const applica = useStore((s) => s.applicaPreset)
  const chiediConferma = useStore((s) => s.chiediConferma)
  const p = useProgettoAttivo()
  const dati = useMemo(() => PRESET.map((x) => ({ x, a: analizza(x.sel) })), [])
  const chiudi = () => apri('preset', false)
  const scegli = (id: string, nome: string) => {
    const pieno = p && Object.values(p.sel).some((v) => (Array.isArray(v) ? v.length : !!v))
    if (pieno) {
      chiediConferma({ titolo: 'Sostituire la build attuale?', testo: `Il preset "${nome}" sostituirà tutti i componenti di "${p.nome}". Potrai comunque modificarli uno per uno.`, etichetta: 'Carica preset', onOk: () => { applica(id); chiudi() } })
    } else {
      applica(id)
      chiudi()
    }
  }
  return (
    <Modale titolo="Preset pronti" sottotitolo="20 configurazioni complete e verificate: caricane una e personalizzala." onClose={chiudi} larghezza="max-w-5xl">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {dati.map(({ x, a }) => (
          <article key={x.id} className="flex flex-col rounded-xl border border-white/[0.07] bg-ant/70 p-3.5 transition-colors hover:border-cy/40">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[14px] font-semibold text-txt">{x.nome}</h3>
              <Badge tono="cy">{x.uso}</Badge>
            </div>
            <p className="mt-1.5 line-clamp-3 flex-1 text-[12px] leading-relaxed text-mut">{x.descrizione}</p>
            <div className="mt-3 flex items-center justify-between text-[12px]">
              <span className="font-semibold tabular-nums text-txt">{euro(a.prezzo)}</span>
              <span className="tabular-nums text-mut">{a.tel.carico} W</span>
              <Badge tono={tonoBuild(a.stato)}>{a.stato.replace('Build ', '')}</Badge>
            </div>
            <Bottone piccolo variante="primario" className="mt-3" onClick={() => scegli(x.id, x.nome)}>
              Usa questo preset
            </Bottone>
          </article>
        ))}
      </div>
    </Modale>
  )
}

/* ------------------------------------------------------------ esporta */

export function ModaleEsporta() {
  const apri = useStore((s) => s.apriModale)
  const p = useProgettoAttivo()
  const a = useAnalisi()
  const rinomina = useStore((s) => s.rinomina)
  const salva = useStore((s) => s.salva)
  const duplica = useStore((s) => s.duplicaProgetto)
  const elimina = useStore((s) => s.eliminaProgetto)
  const chiediConferma = useStore((s) => s.chiediConferma)
  const toast = useStore((s) => s.toast)
  const catalogo = useStore((s) => s.catalogo)
  const pref = useStore((s) => s.pref)
  const setPref = useStore((s) => s.setPref)
  const esploso = useStore((s) => s.esploso)
  const vistaCorrente = useStore((s) => s.vistaCorrente)
  const [nome, setNome] = useState(p?.nome ?? '')
  const [reg, setReg] = useState<number | null>(null)
  if (!p || !a) return null
  const chiudi = () => apri('esporta', false)
  const link = linkCondivisione(p)
  const ui = { camera: vistaCorrente, esploso, vetro: pref.vetro, autoRotazione: pref.autoRotazione, catalogo }
  const cambiaNome = () => {
    if (nome.trim() && nome.trim() !== p.nome) rinomina(p.id, nome)
  }

  const img = (f: 'png' | 'jpeg' | 'webp') => {
    const ok = esportaImmagine(p, f)
    toast(ok ? 'successo' : 'errore', ok ? `Immagine ${f === 'jpeg' ? 'JPG' : f.toUpperCase()} scaricata.` : 'Scena 3D non ancora pronta: apri la pagina «Il tuo PC» e riprova.')
  }
  const video = async () => {
    const prima = pref.autoRotazione
    setPref({ autoRotazione: true })
    setReg(0)
    try {
      const blob = await registraVideo(6, setReg)
      if (blob) {
        scaricaBlob(`${p.nome.replace(/\s+/g, '-').toLowerCase()}.webm`, blob)
        toast('successo', 'Video WebM della build scaricato.')
      } else toast('errore', 'Il tuo browser non supporta la registrazione video.')
    } finally {
      setReg(null)
      setPref({ autoRotazione: prima })
    }
  }
  const condividi = async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: p.nome, text: `Guarda la mia build: ${p.nome}`, url: link })
        return
      } catch {
        /* annullato */
      }
    }
    toast((await copiaTesto(link)) ? 'successo' : 'errore', 'Link di condivisione copiato negli appunti.')
  }

  const Voce = ({ icona, titolo, testo, onClick, disabled, extra }: { icona: React.ReactNode; titolo: string; testo: string; onClick: () => void; disabled?: boolean; extra?: React.ReactNode }) => (
    <button type="button" onClick={onClick} disabled={disabled} className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-ant/70 p-3 text-left transition-all hover:border-cy/40 hover:bg-cy/[0.04] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40">
      <span className="mt-0.5 text-cy">{icona}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-txt">{titolo}</span>
        <span className="block text-[11.5px] leading-snug text-mut">{testo}</span>
        {extra}
      </span>
    </button>
  )

  return (
    <Modale titolo="Completa ed esporta la build" sottotitolo="Salva, condividi o scarica la tua configurazione in vari formati." onClose={chiudi} larghezza="max-w-3xl">
      <div className="space-y-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label htmlFor="nome-build" className="mb-1.5 block text-[12px] font-medium text-mut">
              Nome della build
            </label>
            <input id="nome-build" value={nome} maxLength={60} onChange={(e) => setNome(e.target.value)} onBlur={cambiaNome} onKeyDown={(e) => e.key === 'Enter' && cambiaNome()} className="w-full rounded-lg border border-white/[0.1] bg-obs px-3 py-2.5 text-[14px] text-txt focus:border-cy/60" />
          </div>
          <div className="flex gap-6 pb-1 text-right">
            <div>
              <p className="text-[11px] text-mut">Totale</p>
              <p className="text-[20px] font-semibold tabular-nums text-txt">{euro(a.prezzo)}</p>
            </div>
            <div>
              <p className="text-[11px] text-mut">Consumo</p>
              <p className="text-[20px] font-semibold tabular-nums text-txt">{a.tel.carico} W</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tono={tonoBuild(a.stato)}>{a.stato}</Badge>
          {a.critici > 0 && <Badge tono="rd">{a.critici} critic{a.critici === 1 ? 'o' : 'i'}</Badge>}
          {a.attenzioni > 0 && <Badge tono="am">{a.attenzioni} attenzion{a.attenzioni === 1 ? 'e' : 'i'}</Badge>}
          <span className="text-[11.5px] text-mut">Creata il {dataIt(p.creato)}</span>
        </div>

        <section aria-label="Salvataggio">
          <h3 className="mb-2 text-[11.5px] font-semibold uppercase tracking-wider text-mut">Progetto</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            <Bottone variante="successo" onClick={() => { cambiaNome(); salva() }}>
              <Save size={14} /> {p.salvato ? 'Salvata' : 'Salva build'}
            </Bottone>
            <Bottone onClick={() => { duplica(p.id); chiudi() }}>
              <Copy size={14} /> Duplica
            </Bottone>
            <Bottone
              onClick={() =>
                chiediConferma({ titolo: 'Eliminare il progetto?', testo: `"${p.nome}" verrà eliminato da questo dispositivo. L'operazione non può essere annullata.`, etichetta: 'Elimina progetto', pericolo: true, onOk: () => { elimina(p.id); chiudi() } })
              }
              className="text-rd"
            >
              <Trash2 size={14} /> Elimina
            </Bottone>
          </div>
        </section>

        <section aria-label="Condivisione">
          <h3 className="mb-2 text-[11.5px] font-semibold uppercase tracking-wider text-mut">Condividi</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            <Voce icona={<Link2 size={18} />} titolo="Copia link" testo="Contiene l'intera build: chi lo apre la ritrova identica." onClick={async () => toast((await copiaTesto(link)) ? 'successo' : 'errore', 'Link della build copiato negli appunti.')} />
            <Voce icona={<Clipboard size={18} />} titolo="Copia riepilogo" testo="Elenco testuale dei componenti, prezzi e avvisi." onClick={async () => toast((await copiaTesto(riepilogoTesto(p, a))) ? 'successo' : 'errore', 'Riepilogo testuale copiato.')} />
            <Voce icona={<Share2 size={18} />} titolo="Condividi…" testo="Usa il menu di condivisione del dispositivo." onClick={condividi} />
          </div>
        </section>

        <section aria-label="Download">
          <h3 className="mb-2 text-[11.5px] font-semibold uppercase tracking-wider text-mut">Scarica</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <Voce icona={<FileJson size={18} />} titolo="Dati JSON" testo="Tutti i componenti, specifiche, compatibilità e impostazioni." onClick={() => { esportaJson(p, a, ui); toast('successo', 'File JSON scaricato.') }} />
            <Voce icona={<FileText size={18} />} titolo="Scheda PDF" testo="Apre la stampa: scegli «Salva come PDF»." onClick={() => {
              const ok = esportaPdf(p, a)
              toast(ok ? 'info' : 'errore', ok ? 'Nella finestra di stampa scegli «Salva come PDF».' : 'Il browser ha bloccato la finestra: consenti i popup.')
            }} />
            <Voce icona={<ImageIcon size={18} />} titolo="Immagine della scena" testo="Cattura l'inquadratura attuale del 3D." onClick={() => img('png')} extra={
              <span className="mt-2 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                {(['png', 'jpeg', 'webp'] as const).map((f) => (
                  <span key={f} role="button" tabIndex={0} onClick={() => img(f)} onKeyDown={(e) => e.key === 'Enter' && img(f)} className="rounded-md border border-white/[0.12] px-2 py-0.5 text-[11px] font-medium uppercase text-txt hover:border-cy/50 hover:text-cy">
                    {f === 'jpeg' ? 'jpg' : f}
                  </span>
                ))}
              </span>
            } />
            <Voce icona={<Film size={18} />} titolo={reg === null ? 'Video rotazione (WebM)' : `Registrazione… ${reg.toFixed(0)}/6 s`} testo="6 secondi di rotazione a 360° della build." onClick={video} disabled={reg !== null || !videoSupportato()} />
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-mut">
            <Download size={12} /> I file vengono generati sul tuo dispositivo: nessun dato lascia il browser.
          </p>
        </section>
      </div>
    </Modale>
  )
}

export function Modali() {
  const m = useStore((s) => s.modali)
  const attivo = useProgettoAttivo()
  return (
    <>
      {m.nuovo && <ModaleNuovo />}
      {m.preset && <ModalePreset />}
      {m.esporta && attivo && <ModaleEsporta key={attivo.id} />}
      {m.confronto && <ModaleConfronto />}
      {m.dettaglio && <ModaleDettaglio />}
      <ModaleConferma />
    </>
  )
}

export { RefreshCw, tonoGravita, etichettaGravita }
