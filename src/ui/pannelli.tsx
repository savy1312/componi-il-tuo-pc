import { Activity, AlertOctagon, AlertTriangle, Box, ChevronRight, Eye, EyeOff, Fan, Gauge, Hand, Info, Layers, Minus, Monitor as MonitorIcon, Palette, Plus, RotateCw, ScanLine, Sparkles, Trash2, X, Zap } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { META } from '../data/categorie'
import { trova } from '../data/hardware'
import { PALETTE, EFFETTI, coloriDi } from '../data/palettes'
import { ETICHETTE_CATEGORIA } from '../engine/compat'
import type { Analisi } from '../engine/compat'
import { euro } from '../lib/format'
import { qualitaEffettiva } from '../lib/qualita'
import { cameraApi } from '../scene/sceneApi'
import { useProgettoAttivo, useStore } from '../store/useStore'
import type { VistaCamera } from '../store/useStore'
import type { Categoria, Componente, EffettoRgb } from '../types'
import { CATEGORIE } from '../types'
import { Badge, Bottone, Interruttore, NumeroAnimato, etichettaGravita, tonoBuild, tonoCategoria, tonoGravita } from './base'
import { idsInCategoria } from './Catalogo'

/* ------------------------------------------------------- barra della camera */

const VISTE: { id: VistaCamera; nome: string }[] = [
  { id: 'reset', nome: 'Vista generale' },
  { id: 'frontale', nome: 'Frontale' },
  { id: 'interno', nome: 'Interno' },
  { id: 'scheda-madre', nome: 'Scheda madre' },
  { id: 'dissipatore', nome: 'Dissipatore' },
  { id: 'ram', nome: 'RAM' },
  { id: 'gpu', nome: 'GPU' },
  { id: 'ssd', nome: 'SSD' },
  { id: 'psu', nome: 'Alimentatore' },
  { id: 'ventole', nome: 'Ventole' },
]

export function BarraCamera({ onRgb, rgbAperto }: { onRgb: () => void; rgbAperto: boolean }) {
  const vista = useStore((s) => s.vista)
  const corrente = useStore((s) => s.vistaCorrente)
  const esploso = useStore((s) => s.esploso)
  const toggleEsploso = useStore((s) => s.toggleEsploso)
  const pref = useStore((s) => s.pref)
  const setPref = useStore((s) => s.setPref)
  const modo = useStore((s) => s.modoCamera)
  const setModo = useStore((s) => s.setModoCamera)

  const Ico = ({ attivo, onClick, titolo, children }: { attivo?: boolean; onClick: () => void; titolo: string; children: ReactNode }) => (
    <button type="button" onClick={onClick} aria-pressed={attivo} aria-label={titolo} title={titolo} className={`grid h-8 w-8 place-items-center rounded-lg border transition-all duration-200 active:scale-95 ${attivo ? 'border-cy/50 bg-cy/15 text-cy' : 'border-white/[0.08] text-mut hover:border-white/20 hover:text-txt'}`}>
      {children}
    </button>
  )

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-start justify-between gap-2 p-3">
      <div className="pointer-events-auto glass flex max-w-full items-center gap-1 overflow-x-auto rounded-xl p-1 scroll-y" role="toolbar" aria-label="Viste della camera">
        {VISTE.map((v) => (
          <button key={v.id} type="button" onClick={() => vista(v.id)} aria-pressed={corrente === v.id} className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium transition-colors ${corrente === v.id ? 'bg-cy/15 text-cy' : 'text-mut hover:bg-white/5 hover:text-txt'}`}>
            {v.nome}
          </button>
        ))}
      </div>
      <div className="pointer-events-auto glass scroll-y flex max-w-full items-center gap-1.5 overflow-x-auto rounded-xl p-1.5" role="toolbar" aria-label="Controlli della scena">
        <Ico titolo="Ruota la vista" attivo={modo === 'orbita'} onClick={() => setModo('orbita')}>
          <RotateCw size={15} />
        </Ico>
        <Ico titolo="Sposta la vista" attivo={modo === 'pan'} onClick={() => setModo('pan')}>
          <Hand size={15} />
        </Ico>
        <Ico titolo="Avvicina" onClick={() => cameraApi.zoom(0.8)}>
          <Plus size={15} />
        </Ico>
        <Ico titolo="Allontana" onClick={() => cameraApi.zoom(1.25)}>
          <Minus size={15} />
        </Ico>
        <span className="mx-0.5 h-5 w-px bg-white/10" />
        <Ico titolo="Rotazione automatica" attivo={pref.autoRotazione} onClick={() => setPref({ autoRotazione: !pref.autoRotazione })}>
          <ScanLine size={15} />
        </Ico>
        <Ico titolo={esploso ? 'Ricomponi il PC' : 'Vista esplosa'} attivo={esploso} onClick={toggleEsploso}>
          <Layers size={15} />
        </Ico>
        <Ico titolo={pref.vetro ? 'Nascondi il pannello in vetro' : 'Mostra il pannello in vetro'} attivo={!pref.vetro} onClick={() => setPref({ vetro: !pref.vetro })}>
          {pref.vetro ? <Eye size={15} /> : <EyeOff size={15} />}
        </Ico>
        <Ico titolo="Illuminazione RGB" attivo={rgbAperto} onClick={onRgb}>
          <Palette size={15} />
        </Ico>
        <span className="mx-0.5 h-5 w-px bg-white/10" />
        <Ico titolo={pref.ambiente === 'scrivania' ? 'Torna alla vista studio' : 'Mostra il PC sulla scrivania'} attivo={pref.ambiente === 'scrivania'} onClick={() => setPref({ ambiente: pref.ambiente === 'scrivania' ? 'studio' : 'scrivania' })}>
          <MonitorIcon size={15} />
        </Ico>
        <button type="button" onClick={() => setPref({ qualitaManuale: true, qualita: qualitaEffettiva(pref) === 'alta' ? 'media' : qualitaEffettiva(pref) === 'media' ? 'bassa' : 'alta' })} title="Qualità grafica: se il 3D è lento, abbassala" aria-label={`Qualità grafica: ${qualitaEffettiva(pref)}`} className="h-8 rounded-lg border border-white/[0.08] px-2 text-[11px] font-medium capitalize text-mut transition-colors hover:border-white/20 hover:text-txt">
          {qualitaEffettiva(pref)}
        </button>
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- pannello RGB */

export function PannelloRgb({ onClose }: { onClose: () => void }) {
  const p = useProgettoAttivo()
  const setRgb = useStore((s) => s.setRgb)
  const setBersaglio = useStore((s) => s.setBersaglio)
  if (!p) return null
  const r = p.rgb
  const grad = (cols: string[]) => (cols.length === 1 ? cols[0] : `linear-gradient(90deg, ${cols.join(', ')})`)
  const BERS: { k: keyof typeof r.bersagli; nome: string }[] = [
    { k: 'ram', nome: 'RAM' },
    { k: 'ventole', nome: 'Ventole' },
    { k: 'gpu', nome: 'GPU' },
    { k: 'dissipatore', nome: 'Dissipatore' },
  ]
  return (
    <aside className="absolute bottom-3 left-3 border border-white/10 bg-[#0b1534]/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] z-20 flex max-h-[calc(100%-5.5rem)] w-[min(92%,320px)] flex-col rounded-2xl anim-pop" aria-label="Illuminazione RGB">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-cy" />
          <h2 className="text-[13.5px] font-semibold text-txt">Illuminazione RGB</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Chiudi pannello RGB" className="rounded p-1 text-mut hover:text-txt">
          <X size={16} />
        </button>
      </div>
      <div className="scroll-y space-y-4 px-4 py-3">
        <Interruttore etichetta="RGB attivo" attivo={r.attivo} onChange={(v) => setRgb({ attivo: v })} />
        <div className={r.attivo ? 'space-y-4' : 'pointer-events-none space-y-4 opacity-40'}>
          <div>
            <label htmlFor="effetto" className="mb-1 block text-[11.5px] font-medium text-mut">
              Effetto
            </label>
            <select id="effetto" value={r.effetto} onChange={(e) => setRgb({ effetto: e.target.value as EffettoRgb })} className="w-full rounded-lg border border-white/[0.1] bg-obs px-2.5 py-2 text-[12.5px] text-txt">
              {EFFETTI.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-mut">{EFFETTI.find((e) => e.id === r.effetto)?.descrizione}</p>
          </div>
          <div>
            <p className="mb-1.5 text-[11.5px] font-medium text-mut">Palette</p>
            <div className="grid grid-cols-6 gap-1.5" role="radiogroup" aria-label="Palette colori">
              {PALETTE.map((pal) => (
                <button key={pal.id} type="button" role="radio" aria-checked={r.palette === pal.id} aria-label={pal.nome} title={pal.nome} onClick={() => setRgb({ palette: pal.id })} className={`h-7 rounded-md border-2 transition-transform hover:scale-110 ${r.palette === pal.id ? 'border-white' : 'border-transparent'}`} style={{ background: grad(pal.colori) }} />
              ))}
            </div>
            <label className="mt-2 flex items-center gap-2 text-[11.5px] text-mut">
              <input type="color" value={r.colore} onChange={(e) => setRgb({ colore: e.target.value, palette: 'personalizzato' })} aria-label="Colore personalizzato" className="h-7 w-9 cursor-pointer rounded border border-white/10 bg-transparent" />
              Colore personalizzato {r.palette === 'personalizzato' && <Badge tono="cy">In uso</Badge>}
            </label>
            <div className="mt-2 h-2 rounded-full" style={{ background: grad(coloriDi(r)) }} aria-hidden="true" />
          </div>
          <div>
            <label htmlFor="intensita" className="mb-1 flex justify-between text-[11.5px] font-medium text-mut">
              Intensità <span className="tabular-nums text-txt">{Math.round(r.intensita * 100)}%</span>
            </label>
            <input id="intensita" type="range" min={0.1} max={1} step={0.05} value={r.intensita} onChange={(e) => setRgb({ intensita: Number(e.target.value) })} className="w-full" />
          </div>
          <div>
            <label htmlFor="velocita" className="mb-1 flex justify-between text-[11.5px] font-medium text-mut">
              Velocità <span className="tabular-nums text-txt">{Math.round(r.velocita * 100)}%</span>
            </label>
            <input id="velocita" type="range" min={0} max={1} step={0.05} value={r.velocita} onChange={(e) => setRgb({ velocita: Number(e.target.value) })} className="w-full" />
          </div>
          <div>
            <p className="mb-1 text-[11.5px] font-medium text-mut">Componenti illuminati</p>
            <div className="grid grid-cols-2 gap-x-3">
              {BERS.map((b) => (
                <label key={b.k} className="flex cursor-pointer items-center gap-2 py-1 text-[12.5px] text-txt">
                  <input type="checkbox" checked={r.bersagli[b.k]} onChange={(e) => setBersaglio(b.k, e.target.checked)} className="h-3.5 w-3.5 accent-cyan-400" />
                  {b.nome}
                </label>
              ))}
            </div>
            <p className="mt-1 text-[10.5px] leading-snug text-mut">L'effetto è visibile sui componenti RGB della build (RAM, ventole, GPU, AIO).</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

/* ------------------------------------------------------ riepilogo build */

function RigaCategoria({ cat, stato }: { cat: Categoria; stato: Analisi['statiCategoria'][Categoria] }) {
  const p = useProgettoAttivo()
  const setCategoria = useStore((s) => s.setCategoria)
  const apri = useStore((s) => s.apriModale)
  const rimuovi = useStore((s) => s.rimuovi)
  const vista = useStore((s) => s.vista)
  if (!p) return null
  const ids = idsInCategoria(p.sel, cat)
  const comps = ids.map((i) => trova(i)).filter(Boolean) as Componente[]
  const Icona = META[cat].icona
  const VISTA: Partial<Record<Categoria, VistaCamera>> = { 'scheda-madre': 'scheda-madre', cpu: 'scheda-madre', gpu: 'gpu', ram: 'ram', dissipatore: 'dissipatore', ssd: 'ssd', alimentatore: 'psu', ventole: 'ventole' }

  return (
    <li className="rounded-lg border border-white/[0.05] bg-obs/40 px-2.5 py-2">
      <div className="flex items-center gap-2">
        <Icona size={14} className="shrink-0 text-mut" />
        <span className="flex-1 text-[11.5px] font-medium text-mut">{ETICHETTE_CATEGORIA[cat]}</span>
        <Badge tono={tonoCategoria(stato)}>{stato}</Badge>
      </div>
      {comps.length === 0 ? (
        <button type="button" onClick={() => setCategoria(cat)} className="mt-1.5 flex w-full items-center justify-between rounded-md border border-dashed border-white/10 px-2 py-1.5 text-[12px] text-mut transition-colors hover:border-cy/40 hover:text-cy">
          Scegli {META[cat].breve.toLowerCase()} <ChevronRight size={13} />
        </button>
      ) : (
        <ul className="mt-1.5 space-y-1">
          {comps.map((c) => (
            <li key={c.id} className="group flex items-center gap-2">
              <button type="button" onClick={() => { apri('dettaglio', c.id); const v = VISTA[cat]; if (v) vista(v) }} className="min-w-0 flex-1 text-left" title="Dettagli">
                <span className="block truncate text-[12.5px] font-medium text-txt group-hover:text-cy">{c.nome}</span>
                <span className="block text-[11px] tabular-nums text-mut">{euro(c.prezzo)}</span>
              </button>
              <button type="button" onClick={() => rimuovi(cat, c.id)} aria-label={`Rimuovi ${c.nome}`} title="Rimuovi" className="rounded p-1 text-mut opacity-60 transition-opacity hover:text-rd group-hover:opacity-100">
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

function Barra({ valore, max, tono }: { valore: number; max: number; tono: 'em' | 'am' | 'rd' | 'cy' }) {
  const perc = Math.max(0, Math.min(100, (valore / Math.max(1, max)) * 100))
  const col = { em: 'bg-em', am: 'bg-am', rd: 'bg-rd', cy: 'bg-cy' }[tono]
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]" role="progressbar" aria-valuenow={Math.round(perc)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all duration-500 ${col}`} style={{ width: `${perc}%` }} />
    </div>
  )
}

const Riga = ({ k, v, tono }: { k: string; v: ReactNode; tono?: string }) => (
  <div className="flex items-baseline justify-between gap-3 py-1 text-[12px]">
    <span className="text-mut">{k}</span>
    <span className={`text-right font-medium tabular-nums ${tono ?? 'text-txt'}`}>{v}</span>
  </div>
)

export function PannelloDestro({ a, onEsporta }: { a: Analisi; onEsporta: () => void }) {
  const p = useProgettoAttivo()
  const setCategoria = useStore((s) => s.setCategoria)
  const [aperta, setAperta] = useState<'build' | 'tele' | 'compat'>('build')
  const t = a.tel
  const sezione = (id: typeof aperta, titolo: string, icona: ReactNode, badge?: ReactNode) => (
    <button type="button" onClick={() => setAperta(id)} aria-expanded={aperta === id} className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap border-b-2 px-2 py-2.5 text-[12px] font-medium transition-colors ${aperta === id ? 'border-cy text-cy' : 'border-transparent text-mut hover:text-txt'}`}>
      {icona} {titolo} {badge}
    </button>
  )
  const tonoPsu = t.percPsu > 100 ? 'rd' : t.percPsu > 80 ? 'am' : 'em'
  const nProblemi = a.critici + a.attenzioni

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <Badge tono={tonoBuild(a.stato)} className="!text-[11.5px] !px-2 !py-1">
            {a.stato}
          </Badge>
          <span className="text-[11px] text-mut">
            Punteggio <b className="tabular-nums text-txt">{a.punteggio}</b>/100
          </span>
        </div>
        <div className="mt-2.5">
          <Barra valore={a.punteggio} max={100} tono={a.critici ? 'rd' : a.attenzioni ? 'am' : 'em'} />
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-[11px] text-mut">Totale build</p>
            <NumeroAnimato valore={a.prezzo} formato={(v) => euro(Math.round(v))} className="text-[24px] font-semibold leading-none tabular-nums text-txt" />
          </div>
          <div className="text-right">
            <p className="text-[11px] text-mut">Consumo stimato</p>
            <NumeroAnimato valore={t.carico} formato={(v) => `${Math.round(v)} W`} className="text-[16px] font-semibold leading-none tabular-nums text-txt" />
          </div>
        </div>
      </div>

      <div className="flex border-b border-white/[0.06]" role="tablist">
        {sezione('build', 'Build', <Box size={13} />, <span className="text-[10.5px] text-mut">{a.numComponenti}</span>)}
        {sezione('tele', 'Telemetria', <Activity size={13} />)}
        {sezione('compat', 'Compatibilità', <Zap size={13} />, nProblemi > 0 ? <span className={`grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold text-obs ${a.critici ? 'bg-rd' : 'bg-am'}`}>{nProblemi}</span> : undefined)}
      </div>

      <div className="scroll-y min-h-0 flex-1 px-3 py-3" role="tabpanel">
        {aperta === 'build' && (
          <ul className="space-y-1.5">
            {CATEGORIE.map((c) => (
              <RigaCategoria key={c} cat={c} stato={a.statiCategoria[c]} />
            ))}
          </ul>
        )}

        {aperta === 'tele' && (
          <div className="space-y-4">
            <section className="rounded-xl border border-white/[0.06] bg-obs/40 p-3">
              <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-txt">
                <Zap size={13} className="text-am" /> Alimentazione
              </h3>
              <Barra valore={t.carico} max={t.potenzaPsu || t.consigliato || 1} tono={t.potenzaPsu ? tonoPsu : 'cy'} />
              <div className="mt-2">
                <Riga k="Consumo a pieno carico" v={`${t.carico} W`} />
                <Riga k="Consumo a riposo" v={`${t.riposo} W`} />
                <Riga k="Alimentatore" v={t.potenzaPsu ? `${t.potenzaPsu} W` : 'Non selezionato'} />
                <Riga k="Margine disponibile" v={t.potenzaPsu ? `${t.margine} W` : '—'} tono={t.margine < 0 ? 'text-rd' : t.potenzaPsu && t.percPsu > 80 ? 'text-am' : 'text-em2'} />
                <Riga k="Potenza consigliata" v={`${t.consigliato} W`} />
              </div>
            </section>
            <section className="rounded-xl border border-white/[0.06] bg-obs/40 p-3">
              <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-txt">
                <Fan size={13} className="text-cy" /> Raffreddamento e spazio
              </h3>
              <Riga k="Ventole installate" v={`${t.ventoleInstallate} / ${t.ventoleNecessarie} consigliate`} tono={t.ventoleInstallate < t.ventoleNecessarie ? 'text-am' : 'text-em2'} />
              <Riga k="Posizioni ventola nel case" v={t.slotVentole || '—'} />
              <Riga k="Radiatori installati" v={t.radiatori} />
              <Riga k="Spazio GPU residuo" v={t.spazioGpuMm === null ? '—' : `${t.spazioGpuMm} mm`} tono={t.spazioGpuMm !== null && t.spazioGpuMm < 0 ? 'text-rd' : undefined} />
              <Riga k="Altezza residua dissipatore" v={t.altezzaResiduaMm === null ? '—' : `${t.altezzaResiduaMm} mm`} tono={t.altezzaResiduaMm !== null && t.altezzaResiduaMm < 0 ? 'text-rd' : undefined} />
            </section>
            <section className="rounded-xl border border-white/[0.06] bg-obs/40 p-3">
              <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-txt">
                <Gauge size={13} className="text-ind" /> Slot e archiviazione
              </h3>
              <Riga k="Moduli RAM / slot" v={`${t.ramModuli} / ${t.slotRam || '—'}`} />
              <Riga k="Slot M.2 usati" v={`${t.m2Usati} / ${t.m2Totali || '—'}`} />
              <Riga k="Slot PCIe liberi nel case" v={t.slotPcieLiberi ?? '—'} />
              <Riga k="Archiviazione totale" v={t.capacitaSsdGb ? (t.capacitaSsdGb >= 1000 ? `${(t.capacitaSsdGb / 1000).toFixed(t.capacitaSsdGb % 1000 ? 1 : 0)} TB` : `${t.capacitaSsdGb} GB`) : '—'} />
            </section>
          </div>
        )}

        {aperta === 'compat' && (
          <div className="space-y-2">
            {a.problemi.length === 0 ? (
              <div className="rounded-xl border border-em/25 bg-em/[0.06] p-4 text-center">
                <p className="text-[13px] font-semibold text-em2">Nessun problema rilevato</p>
                <p className="mt-1 text-[11.5px] leading-snug text-mut">{p && a.numComponenti ? 'Tutti i componenti selezionati sono compatibili tra loro.' : 'Aggiungi componenti: verificherò la compatibilità in tempo reale.'}</p>
              </div>
            ) : (
              [...a.problemi]
                .sort((x, y) => ['critico', 'attenzione', 'info'].indexOf(x.gravita) - ['critico', 'attenzione', 'info'].indexOf(y.gravita))
                .map((x) => {
                  const Ico = x.gravita === 'critico' ? AlertOctagon : x.gravita === 'attenzione' ? AlertTriangle : Info
                  return (
                    <div key={x.id} className={`rounded-xl border p-3 ${x.gravita === 'critico' ? 'border-rd/30 bg-rd/[0.06]' : x.gravita === 'attenzione' ? 'border-am/30 bg-am/[0.06]' : 'border-cy/20 bg-cy/[0.04]'}`}>
                      <div className="flex items-center gap-2">
                        <Ico size={14} className={x.gravita === 'critico' ? 'text-rd' : x.gravita === 'attenzione' ? 'text-am' : 'text-cy'} />
                        <Badge tono={tonoGravita(x.gravita)}>{etichettaGravita(x.gravita)}</Badge>
                        <button type="button" onClick={() => setCategoria(x.categoria)} className="ml-auto text-[11px] text-mut underline-offset-2 hover:text-cy hover:underline">
                          {META[x.categoria].breve}
                        </button>
                      </div>
                      <p className="mt-1.5 text-[12.5px] leading-snug text-txt">{x.messaggio}</p>
                      {x.suggerimento && <p className="mt-1 text-[11.5px] leading-snug text-mut">💡 {x.suggerimento}</p>}
                    </div>
                  )
                })
            )}
          </div>
        )}
      </div>

      <div className="border-t border-white/[0.06] bg-ant/95 p-3">
        <Bottone variante="primario" disabled={!a.completabile} onClick={onEsporta} title={a.completabile ? 'Salva ed esporta la tua build' : a.motivoBlocco} className="w-full !py-3 !text-[13.5px]">
          Completa ed Esporta Build
        </Bottone>
        {!a.completabile && <p className="mt-2 text-center text-[11px] leading-snug text-mut">{a.motivoBlocco}</p>}
      </div>
    </div>
  )
}
