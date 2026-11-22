import { ArrowRight, Info } from 'lucide-react'
import { META } from '../data/categorie'
import { per } from '../data/hardware'
import { useStore, useProgettoAttivo } from '../store/useStore'
import { CATEGORIE } from '../types'
import { Bottone } from '../ui/base'
import { Catalogo } from '../ui/Catalogo'

export default function Componenti() {
  const categoria = useStore((s) => s.categoria)
  const setCategoria = useStore((s) => s.setCategoria)
  const vai = useStore((s) => s.vai)
  const apri = useStore((s) => s.apriModale)
  const p = useProgettoAttivo()
  const m = META[categoria]

  return (
    <div className="mx-auto w-full max-w-7xl shrink-0 px-4 pb-4 pt-4 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-cy">Catalogo</p>
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-txt sm:text-[32px]">Componenti</h1>
        </div>
        {p ? (
          <button type="button" onClick={() => vai('pc')} className="inline-flex items-center gap-2 rounded-lg border border-cy/30 bg-cy/10 px-3.5 py-2 text-[12.5px] font-medium text-cy transition-colors hover:bg-cy/15">
            Stai configurando «{p.nome}» <ArrowRight size={14} />
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-ant/70 px-3 py-2 text-[12px] text-mut">
            <Info size={14} className="text-cy" /> Nessun progetto attivo: aggiungendo un componente ne verrà creato uno.
            <Bottone piccolo variante="primario" onClick={() => apri('nuovo', true)}>Nuovo progetto</Bottone>
          </div>
        )}
      </div>

      <div className="mt-4 scroll-y flex gap-1.5 overflow-x-auto pb-2" role="tablist" aria-label="Categorie">
        {CATEGORIE.map((c) => {
          const I = META[c].icona
          const att = c === categoria
          return (
            <button key={c} type="button" role="tab" aria-selected={att} onClick={() => setCategoria(c)} className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-[12.5px] font-medium transition-all ${att ? 'border-cy/40 bg-cy/10 text-cy' : 'border-white/[0.07] text-mut hover:bg-white/[0.04] hover:text-txt'}`}>
              <I size={15} /> {META[c].breve}
              <span className={`rounded-full px-1.5 text-[10.5px] ${att ? 'bg-cy/20' : 'bg-white/[0.07]'}`}>{per(c).length}</span>
            </button>
          )
        })}
      </div>

      <div className="mb-3 mt-1 flex items-start gap-3 rounded-xl border border-white/[0.05] bg-ant/50 px-4 py-3">
        <m.icona size={20} className="mt-0.5 shrink-0 text-cy" />
        <div>
          <h2 className="text-[14px] font-semibold text-txt">{m.etichetta}</h2>
          <p className="text-[12.5px] leading-relaxed text-mut">{m.descrizione}</p>
        </div>
      </div>

      <div className="flex min-h-[60vh] flex-col">
        <Catalogo cat={categoria} />
      </div>
    </div>
  )
}
