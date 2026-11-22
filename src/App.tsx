import { lazy, Suspense, useEffect } from 'react'
import { decodificaBuild, leggiHash } from './lib/share'
import Account from './pages/Account'
import Componenti from './pages/Componenti'
import Home from './pages/Home'
import Scarica from './pages/Scarica'
import ProgettoPc from './pages/ProgettoPc'
import { useStore } from './store/useStore'
import { useModoApp } from './lib/pwa'
import { useControlloAutomatico } from './lib/aggiornamenti'
import { AvvisoAggiornamento } from './ui/Aggiornamenti'
import Nav, { BarraApp } from './ui/Nav'
import Toasts from './ui/Toasts'
import { Modali } from './ui/modali'

const GeneratoreMiniature = lazy(() => import('./scene/Miniature'))

export default function App() {
  const pagina = useStore((s) => s.pagina)
  const sulla = pagina === 'home'
  const modoApp = useModoApp()
  useControlloAutomatico()

  // apre una build condivisa (#b=...) e allinea le preferenze salvate
  useEffect(() => {
    const st = useStore.getState()
    st.setCatalogo({ soloCompatibili: st.pref.soloCompatibili })
    const code = leggiHash()
    if (code) {
      const b = decodificaBuild(code)
      if (b) st.importaProgetto(b)
      else st.toast('errore', 'Il link della build non è valido o è incompleto.')
      history.replaceState(null, '', location.pathname + location.search)
    }
  }, [])

  // scorciatoie dell'app installata (?vai=pc)
  useEffect(() => {
    const v = new URLSearchParams(location.search).get('vai')
    if (v === 'pc' || v === 'componenti' || v === 'account' || v === 'home' || v === 'scarica') {
      useStore.getState().vai(v)
      history.replaceState(null, '', location.pathname + location.hash)
    }
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pagina])

  return (
    <div className={`relative flex flex-col text-txt ${sulla ? 'min-h-screen' : 'h-dvh overflow-hidden'} ${modoApp ? 'pb-[calc(58px+env(safe-area-inset-bottom))]' : ''}`}>
      <AvvisoAggiornamento />
      <Nav />
      <main className={`flex min-h-0 flex-1 flex-col ${pagina === 'componenti' || pagina === 'account' || pagina === 'scarica' ? 'scroll-y' : ''}`}>
        {pagina === 'home' && <Home />}
        {pagina === 'componenti' && <Componenti />}
        {pagina === 'pc' && <ProgettoPc />}
        {pagina === 'scarica' && <Scarica />}
        {pagina === 'account' && <Account />}
      </main>
      {pagina !== 'home' && (
        <Suspense fallback={null}>
          <GeneratoreMiniature />
        </Suspense>
      )}
      {modoApp && <BarraApp />}
      <Modali />
      <Toasts />
    </div>
  )
}
