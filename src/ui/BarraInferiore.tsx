import { Download, Layers, Link2, Monitor, Palette, RotateCcw, Save, Sparkles } from 'lucide-react'
import { euro } from '../lib/format'
import { useAnalisi } from '../lib/hooks'
import { copiaTesto, linkCondivisione } from '../lib/share'
import { useProgettoAttivo, useStore } from '../store/useStore'
import { Badge, Bottone, tonoBuild } from './base'

/** Barra fissa in basso (computer): riepilogo e azioni principali sempre a portata di clic. */
export default function BarraInferiore({ rgbAperto, onRgb }: { rgbAperto: boolean; onRgb: () => void }) {
  const p = useProgettoAttivo()
  const a = useAnalisi()
  const apri = useStore((s) => s.apriModale)
  const salva = useStore((s) => s.salva)
  const esploso = useStore((s) => s.esploso)
  const toggleEsploso = useStore((s) => s.toggleEsploso)
  const pref = useStore((s) => s.pref)
  const setPref = useStore((s) => s.setPref)
  const resetBuild = useStore((s) => s.resetBuild)
  const chiediConferma = useStore((s) => s.chiediConferma)
  const toast = useStore((s) => s.toast)
  if (!p || !a) return null
  const postazione = pref.ambiente === 'scrivania'
  const Tgl = ({ attivo, onClick, icona: I, children }: { attivo: boolean; onClick: () => void; icona: typeof Layers; children: string }) => (
    <button type="button" onClick={onClick} aria-pressed={attivo} className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-colors ${attivo ? 'border-cy/50 bg-cy/15 text-cy' : 'border-white/[0.08] text-mut hover:border-white/20 hover:text-txt'}`}>
      <I size={14} /> {children}
    </button>
  )
  return (
    <div className="hidden shrink-0 items-center gap-x-4 gap-y-2 border-t border-white/[0.08] bg-ant/90 px-4 py-2.5 backdrop-blur lg:flex" role="toolbar" aria-label="Azioni principali">
      <div className="flex items-center gap-3 text-[12.5px]">
        <Badge tono={tonoBuild(a.stato)}>{a.stato}</Badge>
        <span className="text-mut">
          <b className="tabular-nums text-txt">{a.numComponenti}</b> component{a.numComponenti === 1 ? 'e' : 'i'}
        </span>
        <b className="tabular-nums text-txt">{euro(a.prezzo)}</b>
        <span className="tabular-nums text-mut">{a.tel.carico} W</span>
      </div>
      <div className="flex flex-1 flex-wrap items-center justify-center gap-1.5">
        <Tgl attivo={false} onClick={() => apri('preset', true)} icona={Sparkles}>
          Preset
        </Tgl>
        <Tgl attivo={rgbAperto} onClick={onRgb} icona={Palette}>
          RGB
        </Tgl>
        <Tgl attivo={esploso} onClick={toggleEsploso} icona={Layers}>
          Vista esplosa
        </Tgl>
        <Tgl attivo={postazione} onClick={() => setPref({ ambiente: postazione ? 'studio' : 'scrivania' })} icona={Monitor}>
          Postazione completa
        </Tgl>
      </div>
      <div className="flex items-center gap-1.5">
        <Bottone
          piccolo
          onClick={() =>
            chiediConferma({ titolo: 'Azzerare la build?', testo: `Tutti i componenti di "${p.nome}" verranno rimossi. L'operazione non può essere annullata.`, etichetta: 'Azzera build', pericolo: true, onOk: resetBuild })
          }
        >
          <RotateCcw size={13} /> Reset
        </Bottone>
        <Bottone
          piccolo
          onClick={async () => toast((await copiaTesto(linkCondivisione(p))) ? 'successo' : 'errore', 'Link di condivisione copiato negli appunti.')}
        >
          <Link2 size={13} /> Condividi
        </Bottone>
        <Bottone piccolo variante={p.salvato ? 'secondario' : 'successo'} onClick={salva}>
          <Save size={13} /> {p.salvato ? 'Salvata' : 'Salva build'}
        </Bottone>
        <Bottone variante="primario" disabled={!a.completabile} onClick={() => apri('esporta', true)} title={a.completabile ? 'Salva ed esporta la tua build' : a.motivoBlocco}>
          <Download size={14} /> Completa ed Esporta Build
        </Bottone>
      </div>
    </div>
  )
}
