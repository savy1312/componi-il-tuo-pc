import { ArrowLeftRight, Check, ChevronDown, Filter, Plus, RefreshCw, Search, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { FILTRI, META, SUGGERIMENTI_RICERCA, specChiave } from '../data/categorie'
import { per } from '../data/hardware'
import { contaFiltriAttivi, corrispondeFiltri, corrispondeRicerca, elabora, limitiIntervallo, opzioniFiltro, ORDINI, ordina } from '../engine/catalogo'
import type { Filtri, OrdineId } from '../engine/catalogo'
import { selezioneVuota, valutaCandidato } from '../engine/compat'
import type { EsitoCandidato } from '../engine/compat'
import { euro } from '../lib/format'
import { useAnalisi, useDebounced } from '../lib/hooks'
import { useProgettoAttivo, useStore } from '../store/useStore'
import type { Categoria, Componente, Selezione } from '../types'
import { CATEGORIE, CATEGORIE_MULTIPLE } from '../types'
import { Badge, Bottone, Interruttore, Vuoto, tonoCategoria } from './base'
import ImgComponente from './ImgComponente'
import type { Tono } from './base'

export const idsInCategoria = (sel: Selezione, cat: Categoria): string[] => {
  const v = (sel as unknown as Record<string, string | string[] | undefined>)[cat]
  return Array.isArray(v) ? v : v ? [v] : []
}

/** Esiti di compatibilità di ogni componente della categoria rispetto alla build attuale. */
export function useEsiti(cat: Categoria): Map<string, EsitoCandidato> {
  const p = useProgettoAttivo()
  const sel = p?.sel
  return useMemo(() => {
    const s = sel ?? selezioneVuota()
    const m = new Map<string, EsitoCandidato>()
    for (const c of per(cat)) m.set(c.id, valutaCandidato(s, c))
    return m
  }, [sel, cat])
}

const tonoTag = (t: string): Tono => (t === 'Premium' ? 'ind' : t === 'Consigliato' ? 'cy' : t === 'Best Value' ? 'em' : 'gr')

/* ------------------------------------------------------------------ card */

export function CardComponente({ c, esito, selezionato, compatta }: { c: Componente; esito?: EsitoCandidato; selezionato: boolean; compatta?: boolean }) {
  const richiediAggiunta = useStore((s) => s.richiediAggiunta)
  const rimuovi = useStore((s) => s.rimuovi)
  const apri = useStore((s) => s.apriModale)
  const confronto = useStore((s) => s.confronto)
  const toggleConfronto = useStore((s) => s.toggleConfronto)
  const progetto = useProgettoAttivo()
  const haAltro = !CATEGORIE_MULTIPLE.includes(c.categoria) && !!progetto && idsInCategoria(progetto.sel, c.categoria).length > 0
  const inConfronto = confronto.includes(c.id)
  const multi = CATEGORIE_MULTIPLE.includes(c.categoria)
  const lv = esito?.livello ?? 'ok'
  const bordo = selezionato ? 'border-cy/60 shadow-[0_0_0_1px_rgba(34,211,238,0.25),0_0_26px_-10px_rgba(34,211,238,0.55)]' : lv === 'critico' ? 'border-rd/25' : 'border-white/[0.06] hover:border-white/20'

  return (
    <article className={`group relative flex flex-col rounded-xl border bg-ant/80 p-3 transition-all duration-200 hover:-translate-y-0.5 anim-fade ${bordo}`}>
      <button type="button" onClick={() => apri('dettaglio', c.id)} className="flex items-start gap-3 text-left" aria-label={`Dettagli di ${c.nome}`}>
        <ImgComponente c={c} className={`shrink-0 rounded-lg border border-white/[0.05] ${compatta ? 'h-[60px] w-[80px]' : 'h-[72px] w-24'}`} iconSize={compatta ? 18 : 22} />
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-medium uppercase tracking-wider text-mut">{c.marca}</p>
          <h3 className={`font-medium leading-snug text-txt ${compatta ? 'text-[12.5px]' : 'text-[13.5px]'}`}>{c.nome}</h3>
          <p className="mt-0.5 text-[11.5px] text-mut">{specChiave(c)}</p>
        </div>
      </button>

      <div className="mt-2.5 flex flex-wrap items-center gap-1">
        {selezionato && <Badge tono="cy"><Check size={10} /> Nella build</Badge>}
        {lv === 'ok' && !selezionato && <Badge tono="em">Compatibile</Badge>}
        {lv === 'attenzione' && <Badge tono="am" title={esito?.problemi[0]?.messaggio}>Attenzione</Badge>}
        {lv === 'critico' && <Badge tono="rd" title={esito?.problemi[0]?.messaggio}>Incompatibile</Badge>}
        {c.tag.slice(0, compatta ? 1 : 2).map((t) => (
          <Badge key={t} tono={tonoTag(t)}>{t}</Badge>
        ))}
        {c.colore && !compatta && <Badge>{c.colore}</Badge>}
      </div>

      {lv !== 'ok' && esito?.problemi[0] && !selezionato && <p className={`mt-2 text-[11px] leading-snug ${lv === 'critico' ? 'text-rd' : 'text-am'}`}>{esito.problemi[0].messaggio}</p>}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[14px] font-semibold tabular-nums text-txt">{euro(c.prezzo)}</span>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => toggleConfronto(c.id)} aria-pressed={inConfronto} aria-label={inConfronto ? 'Rimuovi dal confronto' : 'Aggiungi al confronto'} title="Confronta" className={`rounded-lg border p-1.5 transition-colors ${inConfronto ? 'border-cy/50 bg-cy/10 text-cy' : 'border-white/[0.08] text-mut hover:text-txt'}`}>
            <ArrowLeftRight size={14} />
          </button>
          {selezionato ? (
            <Bottone piccolo variante="secondario" onClick={() => rimuovi(c.categoria, c.id)}>
              <Trash2 size={13} /> Rimuovi
            </Bottone>
          ) : (
            <Bottone piccolo variante="primario" onClick={() => richiediAggiunta(c)}>
              {multi ? <Plus size={13} /> : haAltro ? <RefreshCw size={12} /> : <Plus size={13} />} {multi ? 'Aggiungi' : haAltro ? 'Sostituisci' : 'Seleziona'}
            </Bottone>
          )}
        </div>
      </div>
    </article>
  )
}

/* --------------------------------------------------------------- filtri */

function PannelloFiltri({ cat }: { cat: Categoria }) {
  const filtri = useStore((s) => s.catalogo.filtri)
  const setCatalogo = useStore((s) => s.setCatalogo)
  const lista = useMemo(() => per(cat), [cat])
  const imposta = (chiave: string, v: Filtri[string] | undefined) => {
    const n = { ...filtri }
    if (v === undefined) delete n[chiave]
    else n[chiave] = v
    setCatalogo({ filtri: n })
  }
  return (
    <div className="space-y-1">
      {FILTRI[cat].map((f) => {
        const fv = filtri[f.chiave]
        if (f.tipo === 'booleano') {
          return <Interruttore key={f.chiave} etichetta={f.etichetta} attivo={fv === true} onChange={(v) => imposta(f.chiave, v ? true : undefined)} />
        }
        if (f.tipo === 'scelta') {
          const opz = opzioniFiltro(lista, f)
          if (opz.length < 2) return null
          const sel = Array.isArray(fv) ? fv : []
          return (
            <details key={f.chiave} className="group border-b border-white/[0.05] py-1.5" open={sel.length > 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-[12.5px] font-medium text-txt">
                <span>
                  {f.etichetta} {sel.length > 0 && <span className="ml-1 text-cy">({sel.length})</span>}
                </span>
                <ChevronDown size={14} className="text-mut transition-transform group-open:rotate-180" />
              </summary>
              <div className="flex flex-wrap gap-1.5 pb-1.5 pt-1">
                {opz.map((o) => {
                  const on = sel.includes(o)
                  return (
                    <button key={o} type="button" aria-pressed={on} onClick={() => imposta(f.chiave, on ? (sel.filter((x) => x !== o).length ? sel.filter((x) => x !== o) : undefined) : [...sel, o])} className={`rounded-md border px-2 py-1 text-[11.5px] transition-colors ${on ? 'border-cy/50 bg-cy/10 text-cy' : 'border-white/[0.08] text-mut hover:text-txt'}`}>
                      {o}
                    </button>
                  )
                })}
              </div>
            </details>
          )
        }
        const [lo, hi] = limitiIntervallo(lista, f)
        if (lo === hi) return null
        const cur = fv && !Array.isArray(fv) && fv !== true ? fv : {}
        const set = (k: 'min' | 'max', raw: string) => {
          const n = { ...cur }
          if (raw === '') delete n[k]
          else n[k] = Number(raw)
          imposta(f.chiave, n.min === undefined && n.max === undefined ? undefined : n)
        }
        return (
          <div key={f.chiave} className="border-b border-white/[0.05] py-2">
            <p className="mb-1.5 text-[12.5px] font-medium text-txt">
              {f.etichetta} {f.unita && <span className="text-mut">({f.unita})</span>}
            </p>
            <div className="flex items-center gap-2">
              <input type="number" inputMode="numeric" aria-label={`${f.etichetta} minimo`} placeholder={String(lo)} value={cur.min ?? ''} onChange={(e) => set('min', e.target.value)} className="w-full rounded-md border border-white/[0.08] bg-obs px-2 py-1.5 text-[12px] text-txt placeholder:text-mut/60" />
              <span className="text-mut">–</span>
              <input type="number" inputMode="numeric" aria-label={`${f.etichetta} massimo`} placeholder={String(hi)} value={cur.max ?? ''} onChange={(e) => set('max', e.target.value)} className="w-full rounded-md border border-white/[0.08] bg-obs px-2 py-1.5 text-[12px] text-txt placeholder:text-mut/60" />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------- catalogo */

export function Catalogo({ cat, compatto = false }: { cat: Categoria; compatto?: boolean }) {
  const p = useProgettoAttivo()
  const catalogo = useStore((s) => s.catalogo)
  const setCatalogo = useStore((s) => s.setCatalogo)
  const setPref = useStore((s) => s.setPref)
  const confronto = useStore((s) => s.confronto)
  const apri = useStore((s) => s.apriModale)
  const [q, setQ] = useState(catalogo.ricerca)
  const [filtriAperti, setFiltriAperti] = useState(false)
  const qDeb = useDebounced(q, 220)
  const esiti = useEsiti(cat)

  useEffect(() => {
    if (qDeb !== catalogo.ricerca) setCatalogo({ ricerca: qDeb })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDeb])
  useEffect(() => {
    if (catalogo.ricerca === '') setQ('')
  }, [catalogo.ricerca])

  const lista = useMemo(() => elabora(cat, catalogo, esiti), [cat, catalogo, esiti])
  const totale = per(cat).length
  const attivi = contaFiltriAttivi(catalogo.filtri) + (catalogo.ricerca ? 1 : 0) + (catalogo.soloCompatibili ? 1 : 0)
  const selezionati = p ? idsInCategoria(p.sel, cat) : []
  const suggerimenti = SUGGERIMENTI_RICERCA.filter((s) => per(cat).some((c) => corrispondeRicerca(c, s))).slice(0, 6)
  const nCrit = [...esiti.values()].filter((e) => e.livello === 'critico').length

  const azzera = () => {
    setQ('')
    setCatalogo({ ricerca: '', filtri: {}, soloCompatibili: false })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-2.5 pb-3">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mut" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Cerca in ${META[cat].breve}… (es. ${suggerimenti[0] ?? 'ATX'})`} aria-label="Cerca componenti" className="w-full rounded-lg border border-white/[0.08] bg-obs py-2.5 pl-9 pr-8 text-[13px] text-txt placeholder:text-mut/70 transition-colors focus:border-cy/50" />
          {q && (
            <button type="button" onClick={() => setQ('')} aria-label="Cancella ricerca" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-mut hover:text-txt">
              <X size={14} />
            </button>
          )}
        </div>
        {!q && suggerimenti.length > 0 && !compatto && (
          <div className="flex flex-wrap gap-1.5">
            {suggerimenti.map((s) => (
              <button key={s} type="button" onClick={() => setQ(s)} className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[11px] text-mut transition-colors hover:border-cy/40 hover:text-cy">
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Bottone piccolo variante={filtriAperti ? 'primario' : 'secondario'} onClick={() => setFiltriAperti((v) => !v)} aria-expanded={filtriAperti}>
            <SlidersHorizontal size={13} /> Filtri {contaFiltriAttivi(catalogo.filtri) > 0 && `(${contaFiltriAttivi(catalogo.filtri)})`}
          </Bottone>
          <label className="sr-only" htmlFor={`ord-${compatto ? 'l' : 'p'}`}>Ordina per</label>
          <select id={`ord-${compatto ? 'l' : 'p'}`} value={catalogo.ordine} onChange={(e) => setCatalogo({ ordine: e.target.value as OrdineId })} className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-obs px-2.5 py-1.5 text-[12px] text-txt">
            {ORDINI.map((o) => (
              <option key={o.id} value={o.id}>
                Ordina: {o.nome}
              </option>
            ))}
          </select>
          {confronto.length > 0 && (
            <Bottone piccolo variante="secondario" onClick={() => apri('confronto', true)} className="border-cy/40 text-cy">
              <ArrowLeftRight size={13} /> Confronta ({confronto.length})
            </Bottone>
          )}
        </div>
        <Interruttore etichetta="Mostra solo compatibili" descrizione={p ? `Nasconde ${nCrit} component${nCrit === 1 ? 'e' : 'i'} non compatibil${nCrit === 1 ? 'e' : 'i'} con la build` : 'Crea o apri un progetto per attivare la verifica'} attivo={catalogo.soloCompatibili} onChange={(v) => { setCatalogo({ soloCompatibili: v }); setPref({ soloCompatibili: v }) }} />
      </div>

      {filtriAperti && (
        <div className="mb-3 max-h-[46vh] overflow-y-auto rounded-xl border border-white/[0.06] bg-obs/60 px-3 py-2 scroll-y anim-fade">
          <PannelloFiltri cat={cat} />
          {attivi > 0 && (
            <Bottone piccolo variante="ghost" onClick={azzera} className="mt-2">
              <X size={12} /> Azzera tutti i filtri
            </Bottone>
          )}
        </div>
      )}

      <div className="mb-2 flex items-center justify-between text-[11.5px] text-mut" aria-live="polite">
        <span>
          {lista.length} di {totale} component{totale === 1 ? 'e' : 'i'}
        </span>
        {attivi > 0 && (
          <button type="button" onClick={azzera} className="text-cy hover:underline">
            Azzera filtri ({attivi})
          </button>
        )}
      </div>

      <div className="scroll-y -mr-1 min-h-0 flex-1 pr-1">
        {lista.length === 0 ? (
          <Vuoto icona={<Filter size={22} />} titolo="Nessun componente trovato" testo="Prova a modificare la ricerca o a rimuovere qualche filtro per ampliare i risultati." azione={<Bottone piccolo onClick={azzera}>Azzera filtri</Bottone>} />
        ) : (
          <div className={compatto ? 'space-y-2.5 pb-4' : 'grid gap-3 pb-6 sm:grid-cols-2 xl:grid-cols-3'}>
            {lista.map((c) => (
              <CardComponente key={c.id} c={c} esito={esiti.get(c.id)} selezionato={selezionati.includes(c.id)} compatta={compatto} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------- selettore categorie */

export function SelettoreCategorie({ orizzontale = false, griglia = false }: { orizzontale?: boolean; griglia?: boolean }) {
  const categoria = useStore((s) => s.categoria)
  const setCategoria = useStore((s) => s.setCategoria)
  const analisi = useAnalisi()
  const p = useProgettoAttivo()
  return (
    <div className={orizzontale ? 'scroll-y flex gap-2 overflow-x-auto pb-2' : griglia ? 'grid grid-cols-2 gap-1' : 'flex flex-col gap-1'} role="tablist" aria-label="Categorie di componenti" aria-orientation={orizzontale ? 'horizontal' : 'vertical'}>
      {CATEGORIE.map((c) => {
        const m = META[c]
        const att = categoria === c
        const stato = analisi?.statiCategoria[c]
        const n = p ? idsInCategoria(p.sel, c).length : 0
        return (
          <button key={c} type="button" role="tab" aria-selected={att} onClick={() => setCategoria(c)} title={m.etichetta} className={`relative flex shrink-0 items-center gap-2 rounded-lg border text-left transition-all duration-200 ${orizzontale ? 'px-3 py-2' : griglia ? 'w-full px-2 py-1.5' : 'w-full px-2.5 py-2'} ${att ? 'border-cy/40 bg-cy/10 text-txt' : 'border-transparent text-mut hover:bg-white/[0.04] hover:text-txt'}`}>
            <m.icona size={16} className={att ? 'text-cy' : ''} />
            <span className="flex-1 whitespace-nowrap text-[12.5px] font-medium">{m.breve}</span>
            {stato && p && (stato === 'Mancante' || stato === 'Incompatibile' || stato === 'Critico' || stato === 'Da verificare') ? (
              <span className={`h-2 w-2 shrink-0 rounded-full ${stato === 'Mancante' ? 'bg-am' : stato === 'Da verificare' ? 'bg-am' : 'bg-rd'}`} aria-label={stato} />
            ) : n > 0 ? (
              <span className="grid h-4 min-w-4 place-items-center rounded-full bg-cy/15 px-1 text-[10px] font-semibold text-cy">{n}</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export { ordina, corrispondeFiltri, tonoCategoria }
