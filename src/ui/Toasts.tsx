import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react'
import { useStore } from '../store/useStore'

const ICONE = { successo: CheckCircle2, errore: XCircle, info: Info, avviso: AlertTriangle }
const COLORI = { successo: 'text-em2', errore: 'text-rd', info: 'text-cy', avviso: 'text-am' }

export default function Toasts() {
  const toasts = useStore((s) => s.toasts)
  const togli = useStore((s) => s.togliToast)
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[min(92vw,380px)] flex-col gap-2" aria-live="polite">
      {toasts.map((t) => {
        const I = ICONE[t.tipo]
        return (
          <div key={t.id} role="status" className="pointer-events-auto flex items-start gap-2.5 rounded-xl glass px-3.5 py-3 anim-slide">
            <I size={17} className={`mt-0.5 shrink-0 ${COLORI[t.tipo]}`} />
            <p className="flex-1 text-[12.5px] leading-snug text-txt">{t.msg}</p>
            <button type="button" onClick={() => togli(t.id)} aria-label="Chiudi notifica" className="text-mut hover:text-txt">
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
