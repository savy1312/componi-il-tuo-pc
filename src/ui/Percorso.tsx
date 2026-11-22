import { ArrowRight, Check, PartyPopper, Wand2 } from 'lucide-react'
import { useMemo } from 'react'
import { META } from '../data/categorie'
import { per } from '../data/hardware'
import { valutaCandidato } from '../engine/compat'
import { useAnalisi } from '../lib/hooks'
import { useProgettoAttivo, useStore } from '../store/useStore'
import type { Categoria, Componente, Selezione } from '../types'
import { Bottone } from './base'
import { idsInCategoria } from './Catalogo'

/** Ordine consigliato di montaggio, con parole semplici per chi parte da zero. */
export interface Passo {
  cat: Categoria
  titolo: string
  cosa: string
  perche: string
  facoltativo?: boolean
}

export const PERCORSO: Passo[] = [
  { cat: 'case', titolo: 'Case', cosa: 'Scegli il case', perche: 'È la “scatola” del tuo PC. Da lui dipende quanto spazio hai per tutto il resto, quindi si parte da qui.' },
  { cat: 'scheda-madre', titolo: 'Scheda madre', cosa: 'Scegli la scheda madre', perche: 'È la base su cui si collegano tutti i componenti. Ti mostriamo solo quelle adatte al tuo case.' },
  { cat: 'cpu', titolo: 'Processore', cosa: 'Scegli il processore', perche: 'È il cervello del PC. Più è potente, più il PC è veloce nei programmi e nei giochi.' },
  { cat: 'dissipatore', titolo: 'Dissipatore', cosa: 'Scegli come raffreddare il processore', perche: 'Tiene fresca la CPU. Ad aria è semplice ed economico, a liquido (AIO) è più silenzioso e scenografico.' },
  { cat: 'ram', titolo: 'RAM', cosa: 'Scegli la memoria RAM', perche: 'Serve ad aprire tanti programmi insieme senza rallentare. Per iniziare bastano 16 GB, per giocare e lavorare meglio 32 GB.' },
  { cat: 'gpu', titolo: 'Scheda video', cosa: 'Scegli la scheda video', perche: 'Fa girare giochi, grafica e video. Se non giochi né monta video puoi anche farne a meno, se il processore ha la grafica integrata.' },
  { cat: 'ssd', titolo: 'SSD', cosa: 'Scegli l’archiviazione (SSD)', perche: 'Qui vivono Windows, giochi e file. Un SSD veloce rende tutto istantaneo: consigliamo almeno 1 TB.' },
  { cat: 'alimentatore', titolo: 'Alimentatore', cosa: 'Scegli l’alimentatore', perche: 'Dà energia a tutto il PC. Deve avere abbastanza watt: te lo diciamo noi se è troppo debole.' },
  { cat: 'ventole', titolo: 'Ventole', cosa: 'Aggiungi altre ventole', perche: 'Facoltativo: più aria che circola significa temperature più basse e meno rumore.', facoltativo: true },
  { cat: 'cavi', titolo: 'Cavi', cosa: 'Aggiungi cavi e accessori', perche: 'Facoltativo: cavi intrecciati e accessori per un montaggio più ordinato e bello da vedere.', facoltativo: true },
]

const haScelto = (sel: Selezione, cat: Categoria) => idsInCategoria(sel, cat).length > 0

/** Il primo passo non ancora fatto (obbligatori per primi). */
export function primoMancante(sel: Selezione): Passo | undefined {
  return PERCORSO.find((x) => !haScelto(sel, x.cat) && !x.facoltativo) ?? PERCORSO.find((x) => !haScelto(sel, x.cat))
}

/** Il miglior componente compatibile da proporre con «Scegli per me». */
export function consigliato(sel: Selezione, cat: Categoria): Componente | undefined {
  const ok = per(cat)
    .map((c) => ({ c, e: valutaCandidato(sel, c) }))
    .filter((x) => x.e.livello === 'ok')
  if (!ok.length) return undefined
  const punti = (c: Componente) => (c.tag.includes('Consigliato') ? 0 : c.tag.includes('Best Value') ? 1 : 2)
  return ok.sort((a, b) => punti(a.c) - punti(b.c) || a.c.prezzo - b.c.prezzo)[0].c
}

/* ------------------------------------------------------------ elenco passi */

export function ElencoPassi() {
  const categoria = useStore((s) => s.categoria)
  const setCategoria = useStore((s) => s.setCategoria)
  const p = useProgettoAttivo()
  const a = useAnalisi()
  if (!p) return null
  return (
    <ol className="grid grid-cols-5 gap-x-1 gap-y-1.5" aria-label="Passi per comporre il PC">
      {PERCORSO.map((x, i) => {
        const fatto = haScelto(p.sel, x.cat)
        const att = categoria === x.cat
        const stato = a?.statiCategoria[x.cat]
        const problema = fatto && (stato === 'Incompatibile' || stato === 'Da verificare')
        return (
          <li key={x.cat}>
            <button
              type="button"
              onClick={() => setCategoria(x.cat)}
              aria-current={att ? 'step' : undefined}
              title={`${x.titolo}${x.facoltativo ? ' (facoltativo)' : ''}`}
              className={`flex w-full flex-col items-center gap-1 rounded-lg border px-0.5 py-1.5 text-center transition-all duration-200 ${att ? 'border-cy/50 bg-cy/10 text-txt' : 'border-transparent text-mut hover:bg-white/[0.04] hover:text-txt'}`}
            >
              <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${problema ? (stato === 'Incompatibile' ? 'bg-rd text-white' : 'bg-am text-black') : fatto ? 'bg-em text-black' : att ? 'bg-cy text-black' : x.facoltativo ? 'border border-dashed border-white/25 text-mut' : 'bg-white/10 text-mut'}`}>
                {problema ? '!' : fatto ? <Check size={13} strokeWidth={3.5} /> : i + 1}
              </span>
              <span className="w-full break-words text-[10px] font-medium leading-tight">{x.titolo}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

/* --------------------------------------------------------------- banner */

export function BannerGuida({ onVaiAlRiepilogo }: { onVaiAlRiepilogo?: () => void }) {
  const categoria = useStore((s) => s.categoria)
  const setCategoria = useStore((s) => s.setCategoria)
  const richiediAggiunta = useStore((s) => s.richiediAggiunta)
  const p = useProgettoAttivo()
  const a = useAnalisi()
  const idx = PERCORSO.findIndex((x) => x.cat === categoria)
  const passo = PERCORSO[idx]
  const fatti = useMemo(() => (p ? PERCORSO.filter((x) => !x.facoltativo && haScelto(p.sel, x.cat)).length : 0), [p])
  const totObb = PERCORSO.filter((x) => !x.facoltativo).length
  if (!p || !passo) return null

  const scelto = haScelto(p.sel, passo.cat)
  const prossimo = PERCORSO.slice(idx + 1).find((x) => !haScelto(p.sel, x.cat)) ?? PERCORSO.find((x) => !haScelto(p.sel, x.cat))
  const finito = !!a && a.completabile
  const proposta = !scelto ? consigliato(p.sel, passo.cat) : undefined

  return (
    <div className="mb-3 overflow-hidden rounded-xl border border-cy/25 bg-gradient-to-br from-cy/[0.09] to-transparent p-3 anim-fade">
      <div className="mb-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]" role="progressbar" aria-valuemin={0} aria-valuemax={totObb} aria-valuenow={fatti} aria-label="Avanzamento della build">
          <div className="h-full rounded-full bg-gradient-to-r from-cy to-em transition-all duration-500" style={{ width: `${(fatti / totObb) * 100}%` }} />
        </div>
        <span className="text-[11px] font-medium tabular-nums text-mut">
          {fatti}/{totObb}
        </span>
      </div>

      {finito && scelto && (!prossimo || prossimo.facoltativo) ? (
        <>
          <p className="flex items-center gap-1.5 text-[13.5px] font-semibold text-txt">
            <PartyPopper size={16} className="text-em" /> Il tuo PC è completo!
          </p>
          <p className="mt-1 text-[12px] leading-snug text-mut">Hai scelto tutto il necessario e i componenti sono compatibili. Controlla il riepilogo ed esporta la build.</p>
          {onVaiAlRiepilogo && (
            <Bottone variante="primario" className="mt-2.5 w-full" onClick={onVaiAlRiepilogo}>
              Vedi il riepilogo <ArrowRight size={15} />
            </Bottone>
          )}
          {prossimo && (
            <button type="button" onClick={() => setCategoria(prossimo.cat)} className="mt-2 text-[11.5px] font-medium text-cy hover:underline">
              Vuoi aggiungere altro? Facoltativo: {prossimo.titolo}
            </button>
          )}
        </>
      ) : (
        <>
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-cy">
            Passo {idx + 1} di {PERCORSO.length}
            {passo.facoltativo ? ' · facoltativo' : ''}
          </p>
          <h2 className="mt-0.5 text-[14.5px] font-semibold leading-snug text-txt">{scelto ? `${passo.titolo}: fatto ✓` : passo.cosa}</h2>
          <p className={`mt-1 text-[12px] leading-snug text-mut ${scelto ? 'hidden sm:block' : ''}`}>{passo.perche}</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {proposta && (
              <Bottone variante="primario" piccolo onClick={() => richiediAggiunta(proposta)} title={`Aggiunge: ${proposta.nome}`}>
                <Wand2 size={13} /> Scegli per me
              </Bottone>
            )}
            {(scelto || passo.facoltativo) && prossimo && (
              <Bottone variante={scelto ? 'primario' : 'secondario'} piccolo onClick={() => setCategoria(prossimo.cat)}>
                {scelto ? 'Avanti' : 'Salta'}: {prossimo.titolo} <ArrowRight size={13} />
              </Bottone>
            )}
          </div>
        </>
      )}
    </div>
  )
}
