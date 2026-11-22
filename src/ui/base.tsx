import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Gravita, StatoBuild, StatoCategoria } from '../types'

/* --------------------------------------------------------------- Badge */

export type Tono = 'cy' | 'em' | 'am' | 'rd' | 'gr' | 'ind'

const TONI: Record<Tono, string> = {
  cy: 'bg-cy/10 text-cy border-cy/25',
  em: 'bg-em/10 text-em2 border-em/25',
  am: 'bg-am/10 text-am border-am/25',
  rd: 'bg-rd/10 text-rd border-rd/30',
  gr: 'bg-white/5 text-mut border-white/10',
  ind: 'bg-ind/10 text-indigo-300 border-ind/30',
}

export function Badge({ tono = 'gr', children, className = '', title }: { tono?: Tono; children: ReactNode; className?: string; title?: string }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[10.5px] font-medium leading-none anim-fade ${TONI[tono]} ${className}`}>
      {children}
    </span>
  )
}

export const tonoCategoria = (s: StatoCategoria): Tono =>
  ({ Mancante: 'am', Selezionato: 'cy', Incompatibile: 'rd', Opzionale: 'gr', 'Da verificare': 'am', Completato: 'em', Consigliato: 'ind', Critico: 'rd' })[s] as Tono

export const tonoBuild = (s: StatoBuild): Tono =>
  ({ 'Build non valida': 'rd', 'Configurazione incompleta': 'am', 'Build da verificare': 'am', 'Build valida': 'em', 'Build ottimizzata': 'cy' })[s] as Tono

export const tonoGravita = (g: Gravita): Tono => (g === 'critico' ? 'rd' : g === 'attenzione' ? 'am' : 'cy')
export const etichettaGravita = (g: Gravita) => (g === 'critico' ? 'Critico' : g === 'attenzione' ? 'Attenzione' : 'Informazione')

/* -------------------------------------------------------------- Modale */

export function Modale({ titolo, sottotitolo, onClose, children, larghezza = 'max-w-3xl', piede }: { titolo: string; sottotitolo?: string; onClose: () => void; children: ReactNode; larghezza?: string; piede?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    ref.current?.focus()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', k)
      document.body.style.overflow = prev
    }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 anim-fade" role="dialog" aria-modal="true" aria-label={titolo}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div ref={ref} tabIndex={-1} className={`relative flex max-h-[92vh] w-full ${larghezza} flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#121216] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] anim-pop outline-none`}>
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-[17px] font-semibold tracking-tight text-txt">{titolo}</h2>
            {sottotitolo && <p className="mt-0.5 text-[12.5px] text-mut">{sottotitolo}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Chiudi" className="rounded-lg p-1.5 text-mut transition-colors hover:bg-white/5 hover:text-txt">
            <X size={18} />
          </button>
        </div>
        <div className="scroll-y min-h-0 flex-1 px-5 py-4">{children}</div>
        {piede && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.06] px-5 py-3">{piede}</div>}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- Pulsanti */

type Variante = 'primario' | 'secondario' | 'ghost' | 'pericolo' | 'successo'
const VARIANTI: Record<Variante, string> = {
  primario: 'bg-cy text-obs hover:bg-[#5fe3f5] font-semibold shadow-[0_0_0_0_rgba(34,211,238,0)] hover:shadow-[0_0_22px_-4px_rgba(34,211,238,0.7)]',
  secondario: 'bg-white/[0.06] text-txt hover:bg-white/10 border border-white/[0.08]',
  ghost: 'text-mut hover:text-txt hover:bg-white/5',
  pericolo: 'bg-rd/90 text-white hover:bg-rd font-semibold',
  successo: 'bg-em text-obs hover:bg-em2 font-semibold',
}

export function Bottone({ variante = 'secondario', piccolo, children, className = '', ...rest }: { variante?: Variante; piccolo?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...rest} className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none ${piccolo ? 'px-2.5 py-1.5 text-[12px]' : 'px-3.5 py-2 text-[13px]'} ${VARIANTI[variante]} ${className}`}>
      {children}
    </button>
  )
}

export function Interruttore({ attivo, onChange, etichetta, descrizione }: { attivo: boolean; onChange: (v: boolean) => void; etichetta: string; descrizione?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1.5">
      <span className="min-w-0">
        <span className="block text-[12.5px] font-medium text-txt">{etichetta}</span>
        {descrizione && <span className="block text-[11px] text-mut">{descrizione}</span>}
      </span>
      <button type="button" role="switch" aria-checked={attivo} aria-label={etichetta} onClick={() => onChange(!attivo)} className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${attivo ? 'bg-cy' : 'bg-white/15'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200 ${attivo ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
    </label>
  )
}

/* ------------------------------------------------------ Numero animato */

export function NumeroAnimato({ valore, formato = (v: number) => String(Math.round(v)), className = '' }: { valore: number; formato?: (v: number) => string; className?: string }) {
  const [v, setV] = useState(valore)
  const da = useRef(valore)
  useEffect(() => {
    const a = da.current
    const b = valore
    if (a === b) return
    const t0 = performance.now()
    let raf = 0
    const passo = (t: number) => {
      const k = Math.min(1, (t - t0) / 420)
      const e = 1 - Math.pow(1 - k, 3)
      setV(a + (b - a) * e)
      if (k < 1) raf = requestAnimationFrame(passo)
      else da.current = b
    }
    raf = requestAnimationFrame(passo)
    return () => {
      cancelAnimationFrame(raf)
      da.current = valore
    }
  }, [valore])
  return <span className={className}>{formato(v)}</span>
}

/* --------------------------------------------------------- Tooltip nativo */

export function Vuoto({ icona, titolo, testo, azione }: { icona: ReactNode; titolo: string; testo: string; azione?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center anim-fade">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.04] text-mut">{icona}</div>
      <div>
        <p className="text-[14px] font-medium text-txt">{titolo}</p>
        <p className="mx-auto mt-1 max-w-sm text-[12.5px] leading-relaxed text-mut">{testo}</p>
      </div>
      {azione}
    </div>
  )
}
