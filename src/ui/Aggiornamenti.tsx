import { ArrowRight, RefreshCw } from 'lucide-react'
import { useAggiornamenti } from '../lib/aggiornamenti'
import { useStore } from '../store/useStore'

export const FRASE_AGGIORNAMENTI = 'Gli aggiornamenti si fanno dal sito'

/** Indirizzo diretto della pagina «Scarica» del sito (funziona anche dall'app installata). */
export const linkScarica = () => new URL('?vai=scarica', document.baseURI).href

/** Messaggio sempre visibile: dove si aggiorna l'app. */
export function MessaggioAggiornamenti({ className = '' }: { className?: string }) {
  const vai = useStore((s) => s.vai)
  const pagina = useStore((s) => s.pagina)
  return (
    <div role="note" className={`flex items-start gap-3 rounded-2xl border border-cy/30 bg-cy/[0.08] px-4 py-3.5 ${className}`}>
      <RefreshCw size={18} className="mt-0.5 shrink-0 text-cy" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[15px] font-semibold leading-snug text-txt">{FRASE_AGGIORNAMENTI}.</p>
        <p className="mt-0.5 text-[13px] leading-snug text-mut">
          Se c’è una versione nuova, l’app te lo dice e ti porta alla pagina <b className="text-txt">Scarica</b>, dove premi «Aggiorna».
          {pagina !== 'scarica' && (
            <>
              {' '}
              <button type="button" onClick={() => vai('scarica')} className="font-medium text-cy underline-offset-4 hover:underline">
                Apri la pagina Scarica
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}

/** Barra in alto che compare solo quando il sito ha una versione più nuova di quella in uso. */
export function AvvisoAggiornamento() {
  const { stato, nuova } = useAggiornamenti()
  const vai = useStore((s) => s.vai)
  const pagina = useStore((s) => s.pagina)
  if (stato !== 'disponibile') return null
  return (
    <div role="alert" className="relative z-50 shrink-0 bg-gradient-to-r from-cy to-ind px-4 py-2.5 text-obs shadow-lg pt-[max(0.625rem,env(safe-area-inset-top))]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-center">
        <p className="text-[13.5px] font-semibold leading-snug">
          È disponibile una nuova versione{nuova ? ` (${nuova.versione})` : ''}. {FRASE_AGGIORNAMENTI}.
        </p>
        {pagina === 'scarica' ? (
          <span className="text-[13px] font-medium">Premi «Aggiorna ora» qui sotto.</span>
        ) : (
          <a
            href={linkScarica()}
            onClick={(e) => {
              e.preventDefault()
              vai('scarica')
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-obs px-4 py-1.5 text-[13px] font-semibold text-cy transition-transform active:scale-95"
          >
            Vai a Scarica e aggiorna <ArrowRight size={14} />
          </a>
        )}
      </div>
    </div>
  )
}
