import { Copy, Download, FolderOpen, LogOut, Plus, Save, ShieldAlert, Smartphone, Trash2, User } from 'lucide-react'
import { useMemo, useState } from 'react'
import { analizza } from '../engine/compat'
import { dataIt, dataOraIt, euro, iniziali } from '../lib/format'
import { scaricaBlob } from '../lib/export'
import { useInstallazione } from '../lib/pwa'
import { qualitaEffettiva } from '../lib/qualita'
import { useStore } from '../store/useStore'
import { Badge, Bottone, Interruttore, Vuoto, tonoBuild } from '../ui/base'

function SezioneApp() {
  const { installata, puoiInstallare, ios, installa } = useInstallazione()
  const toast = useStore((s) => s.toast)
  return (
    <section className="rounded-2xl border border-cy/25 bg-gradient-to-br from-cy/[0.08] to-transparent p-5" aria-label="App per telefono">
      <h2 className="flex items-center gap-2 text-[13.5px] font-semibold text-txt">
        <Smartphone size={16} className="text-cy" /> App per telefono
      </h2>
      {installata ? (
        <p className="mt-2 text-[12.5px] leading-relaxed text-mut">Stai usando l’app installata. Funziona anche senza connessione e i tuoi progetti restano salvati su questo dispositivo.</p>
      ) : (
        <>
          <p className="mt-2 text-[12.5px] leading-relaxed text-mut">Installala sul telefono: icona sulla schermata Home, schermo intero e uso anche senza internet.</p>
          {puoiInstallare ? (
            <Bottone variante="primario" className="mt-3" onClick={async () => ((await installa()) ? toast('successo', 'App installata! La trovi nella schermata Home.') : undefined)}>
              <Download size={14} /> Installa l’app
            </Bottone>
          ) : (
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-[12.5px] leading-relaxed text-txt">
              {ios ? (
                <>
                  <li>Apri questo sito con <b>Safari</b>.</li>
                  <li>Tocca il pulsante <b>Condividi</b> (il quadrato con la freccia).</li>
                  <li>Scegli <b>Aggiungi alla schermata Home</b>.</li>
                </>
              ) : (
                <>
                  <li>Apri questo sito con <b>Chrome</b> sul telefono.</li>
                  <li>Tocca i <b>tre puntini</b> in alto a destra.</li>
                  <li>Scegli <b>Installa app</b> (o «Aggiungi a schermata Home»).</li>
                </>
              )}
            </ol>
          )}
        </>
      )}
    </section>
  )
}

export default function Account() {
  const account = useStore((s) => s.account)
  const projects = useStore((s) => s.projects)
  const activeId = useStore((s) => s.activeId)
  const pref = useStore((s) => s.pref)
  const setPref = useStore((s) => s.setPref)
  const setCatalogo = useStore((s) => s.setCatalogo)
  const creaAccount = useStore((s) => s.creaAccount)
  const aggiornaAccount = useStore((s) => s.aggiornaAccount)
  const esci = useStore((s) => s.esci)
  const eliminaTutto = useStore((s) => s.eliminaTutto)
  const eliminaProgetto = useStore((s) => s.eliminaProgetto)
  const duplica = useStore((s) => s.duplicaProgetto)
  const setAttivo = useStore((s) => s.setAttivo)
  const vai = useStore((s) => s.vai)
  const apri = useStore((s) => s.apriModale)
  const chiediConferma = useStore((s) => s.chiediConferma)
  const toast = useStore((s) => s.toast)
  const [nome, setNome] = useState(account?.nome ?? '')
  const [email, setEmail] = useState(account?.email ?? '')
  const [errore, setErrore] = useState('')

  const dati = useMemo(() => projects.map((p) => ({ p, a: analizza(p.sel) })), [projects])
  const totale = dati.reduce((t, d) => t + d.a.prezzo, 0)
  const salvati = projects.filter((p) => p.salvato).length

  const invia = (e: React.FormEvent) => {
    e.preventDefault()
    if (nome.trim().length < 2) return setErrore('Inserisci un nome di almeno 2 caratteri.')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErrore('Inserisci un indirizzo email valido.')
    setErrore('')
    if (account) aggiornaAccount(nome, email)
    else creaAccount(nome, email)
  }

  const esportaTutto = () => {
    const blob = new Blob([JSON.stringify({ applicazione: 'Componi il tuo PC', esportatoIl: new Date().toISOString(), profilo: account, preferenze: pref, progetti: projects.map(({ miniatura: _m, ...r }) => r) }, null, 2)], { type: 'application/json' })
    scaricaBlob('componi-il-tuo-pc-dati.json', blob)
    toast('successo', 'Tutti i tuoi dati sono stati esportati in un file JSON.')
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-4 sm:px-8">
      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-cy">Profilo</p>
      <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-txt sm:text-[32px]">Account</h1>

      <div className="mt-6 grid gap-4 lg:grid-cols-[360px_1fr]">
        {/* ------------------------------------------------------- profilo */}
        <div className="space-y-4">
          <section className="rounded-2xl glass-solid p-5" aria-label="Profilo">
            <div className="flex items-center gap-3">
              <div className={`grid h-14 w-14 place-items-center rounded-full text-[18px] font-semibold ${account ? 'bg-gradient-to-br from-cy to-ind text-obs' : 'bg-white/[0.06] text-mut'}`}>{account ? iniziali(account.nome) : <User size={22} />}</div>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-txt">{account ? account.nome : 'Ospite'}</p>
                <p className="text-[12px] leading-snug text-mut">{account ? account.email : 'Crea un profilo per personalizzare l’esperienza'}</p>
                {account && <p className="text-[11px] text-mut">Iscritto dal {dataIt(account.creatoIl)}</p>}
              </div>
            </div>
            <form onSubmit={invia} className="mt-5 space-y-3" noValidate>
              <div>
                <label htmlFor="acc-nome" className="mb-1 block text-[11.5px] font-medium text-mut">Nome</label>
                <input id="acc-nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={40} autoComplete="name" className="w-full rounded-lg border border-white/[0.1] bg-obs px-3 py-2.5 text-[13.5px] text-txt focus:border-cy/60" />
              </div>
              <div>
                <label htmlFor="acc-email" className="mb-1 block text-[11.5px] font-medium text-mut">Email</label>
                <input id="acc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="w-full rounded-lg border border-white/[0.1] bg-obs px-3 py-2.5 text-[13.5px] text-txt focus:border-cy/60" />
              </div>
              {errore && <p role="alert" className="text-[12px] text-rd">{errore}</p>}
              <Bottone type="submit" variante="primario" className="w-full">
                <Save size={14} /> {account ? 'Aggiorna profilo' : 'Crea profilo'}
              </Bottone>
              <p className="text-[11px] leading-snug text-mut">Il profilo e i progetti restano salvati su questo dispositivo, nel browser. Non viene creato alcun account online e non serve una password.</p>
            </form>
          </section>

          <SezioneApp />

          <section className="rounded-2xl glass-solid p-5" aria-label="Preferenze">
            <h2 className="text-[13.5px] font-semibold text-txt">Preferenze</h2>
            <div className="mt-2 divide-y divide-white/[0.05]">
              <Interruttore etichetta="Mostra solo componenti compatibili" descrizione="Valido per tutti i cataloghi" attivo={pref.soloCompatibili} onChange={(v) => { setPref({ soloCompatibili: v }); setCatalogo({ soloCompatibili: v }) }} />
              <Interruttore etichetta="Rotazione automatica del 3D" attivo={pref.autoRotazione} onChange={(v) => setPref({ autoRotazione: v })} />
              <Interruttore etichetta="Pannello in vetro visibile" attivo={pref.vetro} onChange={(v) => setPref({ vetro: v })} />
              <Interruttore etichetta="Mostra il PC sulla scrivania" descrizione="Con monitor, tastiera e mouse per un effetto più realistico" attivo={pref.ambiente === 'scrivania'} onChange={(v) => setPref({ ambiente: v ? 'scrivania' : 'studio' })} />
              <div className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="text-[13px] font-medium text-txt">Qualità grafica del 3D</p>
                  <p className="text-[11.5px] text-mut">Sul telefono è «Bassa» per essere più fluida: sul computer puoi alzarla.</p>
                </div>
                <select aria-label="Qualità grafica" value={qualitaEffettiva(pref)} onChange={(e) => setPref({ qualitaManuale: true, qualita: e.target.value as 'alta' | 'media' | 'bassa' })} className="rounded-lg border border-white/[0.1] bg-obs px-2.5 py-1.5 text-[12.5px] text-txt">
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="bassa">Bassa</option>
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-2xl glass-solid p-5" aria-label="Dati">
            <h2 className="text-[13.5px] font-semibold text-txt">I tuoi dati</h2>
            <div className="mt-3 grid gap-2">
              <Bottone onClick={esportaTutto}>
                <Download size={14} /> Esporta tutti i dati (JSON)
              </Bottone>
              {account && (
                <Bottone onClick={() => chiediConferma({ titolo: 'Chiudere la sessione?', testo: 'Il profilo verrà rimosso da questo dispositivo, ma i tuoi progetti resteranno disponibili.', etichetta: 'Esci', onOk: esci })}>
                  <LogOut size={14} /> Esci dal profilo
                </Bottone>
              )}
              <Bottone variante="ghost" className="text-rd hover:!bg-rd/10" onClick={() => chiediConferma({ titolo: 'Eliminare tutti i dati?', testo: 'Profilo, preferenze e tutti i progetti verranno cancellati da questo dispositivo. L’operazione non può essere annullata.', etichetta: 'Elimina tutto', pericolo: true, onOk: eliminaTutto })}>
                <ShieldAlert size={14} /> Elimina tutti i dati locali
              </Bottone>
            </div>
          </section>
        </div>

        {/* ------------------------------------------------------ progetti */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Progetti', String(projects.length)],
              ['Salvati', String(salvati)],
              ['Valore totale', euro(totale)],
              ['Componenti', String(dati.reduce((t, d) => t + d.a.numComponenti, 0))],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl glass-solid px-4 py-3.5">
                <p className="text-[11.5px] text-mut">{k}</p>
                <p className="mt-0.5 text-[20px] font-semibold tabular-nums text-txt">{v}</p>
              </div>
            ))}
          </div>

          <section className="rounded-2xl glass-solid p-5" aria-label="I tuoi progetti">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-semibold text-txt">I tuoi progetti</h2>
              <Bottone piccolo variante="primario" onClick={() => apri('nuovo', true)}>
                <Plus size={13} /> Nuovo progetto
              </Bottone>
            </div>
            {dati.length === 0 ? (
              <Vuoto icona={<FolderOpen size={24} />} titolo="Nessun progetto salvato" testo="Crea il tuo primo PC con il pulsante «+»: comparirà qui con anteprima, prezzo e stato di compatibilità." />
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {dati.map(({ p, a }) => (
                  <article key={p.id} className={`overflow-hidden rounded-xl border bg-ant/70 transition-colors ${p.id === activeId ? 'border-cy/40' : 'border-white/[0.07]'}`}>
                    <div className="relative aspect-[16/10] bg-gradient-to-br from-tec to-obs">
                      {p.miniatura ? <img src={p.miniatura} alt={`Anteprima di ${p.nome}`} className="h-full w-full object-cover" loading="lazy" /> : <div className="grid h-full place-items-center text-mut/60"><FolderOpen size={32} strokeWidth={1.2} /></div>}
                      <div className="absolute left-2 top-2 flex gap-1">
                        {p.id === activeId && <Badge tono="cy">Attivo</Badge>}
                        {p.salvato && <Badge tono="em">Salvato</Badge>}
                      </div>
                    </div>
                    <div className="p-3.5">
                      <h3 className="truncate text-[14px] font-semibold text-txt">{p.nome}</h3>
                      <p className="mt-0.5 text-[11px] text-mut">Aggiornato {dataOraIt(p.aggiornato)}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[14px] font-semibold tabular-nums text-txt">{euro(a.prezzo)}</span>
                        <Badge tono={tonoBuild(a.stato)}>{a.stato}</Badge>
                      </div>
                      <p className="mt-1 text-[11.5px] text-mut">{a.numComponenti} component{a.numComponenti === 1 ? 'e' : 'i'} · {a.tel.carico} W</p>
                      <div className="mt-3 flex gap-1.5">
                        <Bottone piccolo variante="primario" className="flex-1" onClick={() => { setAttivo(p.id); vai('pc') }}>
                          <FolderOpen size={13} /> Apri
                        </Bottone>
                        <Bottone piccolo onClick={() => duplica(p.id)} aria-label={`Duplica ${p.nome}`} title="Duplica">
                          <Copy size={13} />
                        </Bottone>
                        <Bottone piccolo onClick={() => chiediConferma({ titolo: 'Eliminare il progetto?', testo: `"${p.nome}" verrà eliminato da questo dispositivo. L'operazione non può essere annullata.`, etichetta: 'Elimina progetto', pericolo: true, onOk: () => eliminaProgetto(p.id) })} aria-label={`Elimina ${p.nome}`} title="Elimina" className="text-rd">
                          <Trash2 size={13} />
                        </Bottone>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
