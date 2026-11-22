import { useEffect, useRef, useState } from 'react'
import { GOOGLE_CLIENT_ID, caricaGoogle, leggiCredenziale } from '../lib/google'
import { useStore } from '../store/useStore'

/** Pulsante ufficiale «Continua con Google»: vale sia per registrarsi sia per accedere. */
export function AccessoGoogle() {
  const box = useRef<HTMLDivElement>(null)
  const accedi = useStore((s) => s.accediGoogle)
  const toast = useStore((s) => s.toast)
  const [stato, setStato] = useState<'carico' | 'pronto' | 'errore'>('carico')

  useEffect(() => {
    let vivo = true
    caricaGoogle()
      .then((g) => {
        if (!vivo || !box.current) return
        g.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: (r) => {
            const p = r.credential ? leggiCredenziale(r.credential) : null
            if (!p) return toast('errore', 'Accesso con Google non riuscito. Riprova.')
            accedi({ nome: p.nome, email: p.email, foto: p.foto })
          },
        })
        const larg = Math.min(320, Math.max(200, Math.floor(box.current.clientWidth || 300)))
        g.accounts.id.renderButton(box.current, { type: 'standard', theme: 'filled_blue', size: 'large', text: 'continue_with', shape: 'pill', logo_alignment: 'left', locale: 'it', width: larg })
        setStato('pronto')
      })
      .catch(() => vivo && setStato('errore'))
    return () => {
      vivo = false
    }
  }, [accedi, toast])

  return (
    <div>
      <div ref={box} className="flex min-h-[44px] justify-center" aria-live="polite" />
      {stato === 'carico' && <p className="text-center text-[12px] text-mut">Preparo l’accesso con Google…</p>}
      {stato === 'errore' && <p role="alert" className="text-center text-[12.5px] text-rd">Non riesco a raggiungere Google. Controlla la connessione e riapri questa pagina.</p>}
    </div>
  )
}
