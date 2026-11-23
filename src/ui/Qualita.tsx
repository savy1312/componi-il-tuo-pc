import { Check, Gauge, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { LIVELLI, PROFILI, modoAutomatico, qualitaEffettiva, useQualita, useStatistiche } from '../lib/qualita'
import type { Livello } from '../lib/qualita'
import { useStore } from '../store/useStore'

/** Menu della qualità grafica: Auto + 5 livelli, con descrizione di cosa cambia. */
export function MenuQualita() {
  const pref = useStore((s) => s.pref)
  const setPref = useStore((s) => s.setPref)
  const livello = useQualita(pref)
  const auto = modoAutomatico(pref)
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

  const scegli = (l: Livello | 'auto') => {
    setPref(l === 'auto' ? { qualitaManuale: false } : { qualitaManuale: true, qualita: l })
    setAperto(false)
  }

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setAperto((v) => !v)} aria-haspopup="menu" aria-expanded={aperto} title="Qualità grafica del 3D" className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] px-2 text-[11px] font-medium text-mut transition-colors hover:border-white/20 hover:text-txt">
        <Gauge size={14} />
        <span>{auto ? `Auto · ${PROFILI[livello].nome}` : PROFILI[livello].nome}</span>
      </button>
      {aperto && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-1.5 w-72 overflow-hidden rounded-xl border border-white/10 bg-[#0b1534] p-1 shadow-2xl anim-fade">
          <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-mut">Qualità grafica</p>
          {(['auto', ...LIVELLI] as const).map((l) => {
            const attivo = l === 'auto' ? auto : !auto && livello === l
            return (
              <button key={l} type="button" role="menuitemradio" aria-checked={attivo} onClick={() => scegli(l)} className={`flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/[0.06] ${attivo ? 'bg-cy/10' : ''}`}>
                <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center">{attivo && <Check size={14} className="text-cy" />}</span>
                <span className="min-w-0">
                  <span className="block text-[12.5px] font-medium text-txt">{l === 'auto' ? 'Automatica (consigliata)' : PROFILI[l].nome}</span>
                  <span className="block text-[11.5px] leading-snug text-mut">{l === 'auto' ? 'Sceglie da sola il livello migliore in base agli FPS del tuo dispositivo.' : PROFILI[l].descrizione}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Pannellino FPS / ms / risoluzione sopra la scena. */
export function PannelloPrestazioni() {
  const s = useStatistiche()
  const pref = useStore((s2) => s2.pref)
  const l = qualitaEffettiva(pref)
  const tono = s.fps >= 50 ? 'text-em' : s.fps >= 30 ? 'text-am' : 'text-rd'
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-xl glass px-3 py-2 text-[11px] tabular-nums text-mut" role="status" aria-label="Prestazioni del 3D">
      <p className="mb-1 flex items-center gap-1.5 font-semibold text-txt">
        <Zap size={12} className="text-cy" /> Prestazioni
      </p>
      <p>
        <b className={`text-[13px] ${tono}`}>{s.fps}</b> FPS · {s.ms} ms
      </p>
      <p>{s.risoluzione}</p>
      <p>
        {s.chiamate} draw call · {Math.round(s.triangoli / 1000)}k triangoli
      </p>
      <p>Qualità {PROFILI[l].nome}</p>
    </div>
  )
}

/** Selettore completo per la pagina Account. */
export function SelettoreQualita() {
  const pref = useStore((s) => s.pref)
  const setPref = useStore((s) => s.setPref)
  const livello = useQualita(pref)
  const valore = modoAutomatico(pref) ? 'auto' : livello
  return (
    <select aria-label="Qualità grafica" value={valore} onChange={(e) => setPref(e.target.value === 'auto' ? { qualitaManuale: false } : { qualitaManuale: true, qualita: e.target.value as Livello })} className="rounded-lg border border-white/[0.1] bg-obs px-2.5 py-1.5 text-[12.5px] text-txt">
      <option value="auto">Automatica</option>
      {LIVELLI.map((l) => (
        <option key={l} value={l}>
          {PROFILI[l].nome}
        </option>
      ))}
    </select>
  )
}
