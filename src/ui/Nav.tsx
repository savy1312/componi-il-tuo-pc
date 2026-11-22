import { Download, Home, LayoutGrid, Monitor, Plus, User } from 'lucide-react'
import { useModoApp } from '../lib/pwa'
import { useStore } from '../store/useStore'
import type { Pagina } from '../types'
import { Logo } from './Logo'

const LINK: { id: Pagina; nome: string }[] = [
  { id: 'home', nome: 'Home' },
  { id: 'componenti', nome: 'Componenti' },
  { id: 'pc', nome: 'Il tuo PC' },
  { id: 'scarica', nome: 'Scarica' },
  { id: 'account', nome: 'Account' },
]

const ICONE = { home: Home, componenti: LayoutGrid, pc: Monitor, scarica: Download, account: User } as const

/** Barra di navigazione in basso, solo quando il sito è installato come app su telefono. */
export function BarraApp() {
  const pagina = useStore((s) => s.pagina)
  const vai = useStore((s) => s.vai)
  return (
    <nav aria-label="Navigazione dell'app" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/[0.08] bg-[#0a1330]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      {LINK.map((l) => {
        const I = ICONE[l.id]
        const att = pagina === l.id
        return (
          <button key={l.id} type="button" onClick={() => vai(l.id)} aria-current={att ? 'page' : undefined} className={`flex flex-col items-center gap-0.5 py-2 text-[10.5px] font-medium transition-colors active:scale-95 ${att ? 'text-cy' : 'text-mut'}`}>
            <I size={21} strokeWidth={att ? 2.4 : 1.8} />
            {l.nome}
          </button>
        )
      })}
    </nav>
  )
}

export default function Nav() {
  const pagina = useStore((s) => s.pagina)
  const vai = useStore((s) => s.vai)
  const apri = useStore((s) => s.apriModale)
  const modoApp = useModoApp()
  const sovrapposta = pagina === 'home'

  return (
    <header className={`pt-[env(safe-area-inset-top)] ${sovrapposta ? 'absolute inset-x-0 top-0 z-40' : 'relative z-40 shrink-0'}`}>
      <nav aria-label="Navigazione principale" className={`relative flex items-center pt-4 sm:pt-6 px-4 sm:px-8 gap-2 sm:gap-3 pb-3 ${modoApp ? 'justify-between' : 'justify-center'}`}>
        <button type="button" onClick={() => vai('home')} aria-label="Componi il tuo PC — vai alla Home" className="flex items-center justify-center rounded-full w-10 h-10 sm:w-11 sm:h-11 shrink-0 transition-transform duration-200 hover:scale-105" style={{ backgroundColor: '#EDEDED' }}>
          <Logo />
        </button>

        {modoApp && <span className={`flex-1 truncate text-[15px] font-semibold ${sovrapposta ? 'text-gray-900' : 'text-txt'}`}>{LINK.find((l) => l.id === pagina)?.nome}</span>}
        <div className={`${modoApp ? 'hidden' : 'flex'} items-center gap-2.5 sm:gap-8 rounded-xl px-3 sm:px-7 py-2.5 sm:py-3`} style={{ backgroundColor: '#EDEDED' }}>
          {LINK.map((l) => {
            const att = pagina === l.id
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => vai(l.id)}
                aria-current={att ? 'page' : undefined}
                className={`relative text-[12px] sm:text-[14px] font-medium transition-colors duration-200 whitespace-nowrap ${att ? 'text-gray-900' : 'text-gray-700 hover:text-gray-900'}`}
              >
                {l.nome}
                <span className={`absolute -bottom-1 left-0 h-[2px] rounded-full bg-gray-900 transition-all duration-200 ${att ? 'w-full' : 'w-0'}`} />
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => apri('nuovo', true)}
          aria-label="Crea un nuovo progetto di PC"
          title="Nuovo progetto"
          className="group flex items-center justify-center rounded-full w-10 h-10 sm:w-11 sm:h-11 shrink-0 text-gray-700 transition-all duration-200 hover:bg-gray-900 hover:text-white sm:absolute sm:right-8"
          style={{ backgroundColor: '#EDEDED' }}
        >
          <Plus size={18} className="transition-transform duration-200 group-hover:rotate-90" />
        </button>
      </nav>
    </header>
  )
}
