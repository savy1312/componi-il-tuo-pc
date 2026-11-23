import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PRESET } from '../data/presets'
import { RGB_DEFAULT } from '../data/palettes'
import { analizza, conComponente, selezioneVuota, senzaComponente, valutaCandidato } from '../engine/compat'
import { STATO_INIZIALE } from '../engine/catalogo'
import type { StatoCatalogo } from '../engine/catalogo'
import { uid } from '../lib/format'
import type { BuildImportata } from '../lib/share'
import type { Account, Categoria, Componente, ImpostazioniRgb, Pagina, Progetto } from '../types'

export type VistaCamera = 'reset' | 'frontale' | 'laterale' | 'posteriore' | 'alto' | 'cablaggio' | 'interno' | 'scheda-madre' | 'psu' | 'ventole' | 'gpu' | 'ram' | 'dissipatore' | 'ssd'

export interface Toast {
  id: number
  tipo: 'successo' | 'errore' | 'info' | 'avviso'
  msg: string
}

export interface Conferma {
  titolo: string
  testo: string
  dettagli?: string[]
  etichetta: string
  pericolo?: boolean
  onOk: () => void
}

export type Evidenziazione = 'nessuna' | 'compatibilita' | 'consigliato' | 'premium' | 'budget' | 'silenzioso' | 'rgb'
export type ModoVista = 'normale' | 'wireframe' | 'componenti' | 'solo-pc'

export interface Preferenze {
  soloCompatibili: boolean
  autoRotazione: boolean
  vetro: boolean
  qualita?: 'bassa' | 'media' | 'alta' | 'ultra' | '4k'
  qualitaManuale?: boolean
  ambiente?: 'studio' | 'scrivania'
  /** Mostra FPS e statistiche sopra la scena. */
  prestazioni?: boolean
  /** Modalità prestazioni: meno effetti, più fluidità. */
  risparmio?: boolean
  /** Cosa mostra il monitor nella postazione. */
  schermo?: 'monitoraggio' | 'desktop' | 'sfondo' | 'spento'
  /** Immagine di sfondo scelta dall'utente (ridimensionata, salvata sul dispositivo). */
  sfondoSchermo?: string
}

interface Stato {
  account: Account | null
  projects: Progetto[]
  activeId: string | null
  pref: Preferenze

  pagina: Pagina
  categoria: Categoria
  catalogo: StatoCatalogo
  modali: { nuovo: boolean; preset: boolean; esporta: boolean; confronto: boolean; dettaglio: string | null }
  confronto: string[]
  conferma: Conferma | null
  esploso: boolean
  vistaReq: { id: number; vista: VistaCamera }
  toasts: Toast[]
  vistaCorrente: VistaCamera
  modoCamera: 'orbita' | 'pan'
  /** Componente 3D selezionato con un clic sulla scena. */
  selezionato: Categoria | null
  setSelezionato: (c: Categoria | null) => void
  evidenzia: Evidenziazione
  setEvidenzia: (e: Evidenziazione) => void
  modoVista: ModoVista
  setModoVista: (m: ModoVista) => void
  setModoCamera: (m: 'orbita' | 'pan') => void

  vai: (p: Pagina) => void
  setCategoria: (c: Categoria) => void
  setCatalogo: (p: Partial<StatoCatalogo>) => void
  apriModale: (k: keyof Stato['modali'], v: boolean | string | null) => void
  chiediConferma: (c: Conferma) => void
  chiudiConferma: () => void
  toast: (tipo: Toast['tipo'], msg: string) => void
  togliToast: (id: number) => void
  toggleConfronto: (id: string) => void
  svuotaConfronto: () => void

  creaProgetto: (nome: string, presetId?: string, naviga?: boolean) => string
  importaProgetto: (b: BuildImportata) => string
  setAttivo: (id: string) => void
  eliminaProgetto: (id: string) => void
  duplicaProgetto: (id: string) => void
  rinomina: (id: string, nome: string) => void
  richiediAggiunta: (c: Componente) => void
  aggiungi: (c: Componente) => void
  rimuovi: (cat: Categoria, id?: string) => void
  resetBuild: () => void
  applicaPreset: (presetId: string) => void
  setRgb: (p: Partial<ImpostazioniRgb>) => void
  setBersaglio: (k: keyof ImpostazioniRgb['bersagli'], v: boolean) => void
  setGpuVerticale: (v: boolean) => void
  salva: () => void
  setMiniatura: (id: string, dataUrl: string) => void
  setPref: (p: Partial<Preferenze>) => void
  toggleEsploso: () => void
  vista: (v: VistaCamera) => void

  creaAccount: (nome: string, email: string) => void
  accediGoogle: (p: { nome: string; email: string; foto?: string }) => void
  aggiornaAccount: (nome: string, email: string) => void
  esci: () => void
  eliminaTutto: () => void
}

let toastId = 1

const nuovoProgetto = (nome: string): Progetto => {
  const ora = new Date().toISOString()
  return { id: uid(), nome, creato: ora, aggiornato: ora, salvato: false, sel: selezioneVuota(), rgb: { ...RGB_DEFAULT, bersagli: { ...RGB_DEFAULT.bersagli } }, gpuVerticale: false }
}

export const useStore = create<Stato>()(
  persist(
    (set, get) => {
      /** Applica una modifica al progetto attivo aggiornandone la data. */
      const modifica = (fn: (p: Progetto) => Progetto) => {
        const { activeId } = get()
        set((s) => ({ projects: s.projects.map((p) => (p.id === activeId ? { ...fn(p), aggiornato: new Date().toISOString(), salvato: false } : p)) }))
      }
      const attivo = () => get().projects.find((p) => p.id === get().activeId)

      return {
        account: null,
        projects: [],
        activeId: null,
        pref: { soloCompatibili: false, autoRotazione: false, vetro: true, ambiente: 'studio' },

        pagina: 'home',
        categoria: 'case',
        catalogo: { ...STATO_INIZIALE },
        modali: { nuovo: false, preset: false, esporta: false, confronto: false, dettaglio: null },
        confronto: [],
        conferma: null,
        esploso: false,
        vistaReq: { id: 0, vista: 'reset' },
        vistaCorrente: 'reset',
        modoCamera: 'orbita',
        selezionato: null,
        setSelezionato: (c) => set({ selezionato: c }),
        evidenzia: 'nessuna',
        setEvidenzia: (e) => set({ evidenzia: e }),
        modoVista: 'normale',
        setModoVista: (m) => set({ modoVista: m }),
        setModoCamera: (m) => set({ modoCamera: m }),
        toasts: [],

        vai: (p) => set({ pagina: p }),
        setCategoria: (c) => set((s) => ({ categoria: c, catalogo: { ...s.catalogo, ricerca: '', filtri: {} } })),
        setCatalogo: (p) => set((s) => ({ catalogo: { ...s.catalogo, ...p } })),
        apriModale: (k, v) => set((s) => ({ modali: { ...s.modali, [k]: v } })),
        chiediConferma: (c) => set({ conferma: c }),
        chiudiConferma: () => set({ conferma: null }),
        toast: (tipo, msg) => {
          const id = toastId++
          set((s) => ({ toasts: [...s.toasts.slice(-3), { id, tipo, msg }] }))
          setTimeout(() => get().togliToast(id), 4200)
        },
        togliToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
        toggleConfronto: (id) =>
          set((s) => {
            if (s.confronto.includes(id)) return { confronto: s.confronto.filter((x) => x !== id) }
            if (s.confronto.length >= 3) {
              get().toast('avviso', 'Puoi confrontare al massimo 3 componenti alla volta.')
              return {}
            }
            return { confronto: [...s.confronto, id] }
          }),
        svuotaConfronto: () => set({ confronto: [] }),

        creaProgetto: (nome, presetId, naviga = true) => {
          const p = nuovoProgetto(nome.trim() || 'Il mio PC')
          const preset = presetId ? PRESET.find((x) => x.id === presetId) : undefined
          if (preset) {
            p.sel = { ...preset.sel, ssd: [...preset.sel.ssd], ventole: [...preset.sel.ventole], cavi: [...preset.sel.cavi] }
            p.rgb = { ...preset.rgb, bersagli: { ...preset.rgb.bersagli } }
            p.gpuVerticale = !!preset.gpuVerticale
            p.presetId = preset.id
          }
          set((s) => ({ projects: [p, ...s.projects], activeId: p.id, pagina: naviga ? 'pc' : s.pagina, esploso: false }))
          if (naviga) get().toast('successo', preset ? `Progetto "${p.nome}" creato dal preset ${preset.nome}.` : `Nuovo progetto "${p.nome}" creato.`)
          return p.id
        },
        importaProgetto: (b) => {
          const p = nuovoProgetto(b.nome)
          p.sel = b.sel
          p.rgb = b.rgb
          p.gpuVerticale = b.gpuVerticale
          set((s) => ({ projects: [p, ...s.projects], activeId: p.id, pagina: 'pc' }))
          get().toast('successo', `Build condivisa "${p.nome}" caricata.`)
          return p.id
        },
        setAttivo: (id) => set({ activeId: id, esploso: false, selezionato: null }),
        eliminaProgetto: (id) => {
          const nome = get().projects.find((p) => p.id === id)?.nome
          set((s) => {
            const projects = s.projects.filter((p) => p.id !== id)
            return { projects, activeId: s.activeId === id ? (projects[0]?.id ?? null) : s.activeId }
          })
          get().toast('info', `Progetto "${nome}" eliminato.`)
        },
        duplicaProgetto: (id) => {
          const src = get().projects.find((p) => p.id === id)
          if (!src) return
          const ora = new Date().toISOString()
          const copia: Progetto = { ...src, id: uid(), nome: `${src.nome} (copia)`, creato: ora, aggiornato: ora, salvato: false, sel: { ...src.sel, ssd: [...src.sel.ssd], ventole: [...src.sel.ventole], cavi: [...src.sel.cavi] }, rgb: { ...src.rgb, bersagli: { ...src.rgb.bersagli } } }
          set((s) => ({ projects: [copia, ...s.projects], activeId: copia.id }))
          get().toast('successo', `Progetto duplicato come "${copia.nome}".`)
        },
        rinomina: (id, nome) => {
          const n = nome.trim()
          if (!n) return
          set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, nome: n.slice(0, 60), aggiornato: new Date().toISOString() } : p)) }))
        },

        richiediAggiunta: (c) => {
          let p = attivo()
          if (!p) {
            get().creaProgetto('Il mio PC', undefined, false)
            p = attivo()
          }
          if (!p) return
          const esito = valutaCandidato(p.sel, c)
          if (esito.livello === 'critico') {
            get().chiediConferma({
              titolo: 'Componente non compatibile',
              testo: `${c.nome} non è compatibile con la build attuale. Aggiungerlo comunque?`,
              dettagli: esito.problemi.map((x) => x.messaggio),
              etichetta: 'Aggiungi comunque',
              pericolo: true,
              onOk: () => get().aggiungi(c),
            })
            return
          }
          get().aggiungi(c)
        },
        aggiungi: (c) => {
          const p = attivo()
          if (!p) return
          const sost = !['ssd', 'ventole', 'cavi'].includes(c.categoria) && !!(p.sel as unknown as Record<string, unknown>)[c.categoria]
          const presente = ['ssd', 'ventole', 'cavi'].includes(c.categoria) && (p.sel[c.categoria as 'ssd'] as string[]).includes(c.id)
          if (presente) {
            get().toast('info', `${c.nome} è già nella build.`)
            return
          }
          modifica((x) => ({ ...x, sel: conComponente(x.sel, c) }))
          get().toast('successo', sost ? `${c.nome} ha sostituito il componente precedente.` : `${c.nome} aggiunto a "${p.nome}".`)
          const a = analizza(attivo()!.sel)
          const crit = a.problemi.filter((x) => x.gravita === 'critico' && x.componenti.includes(c.id))
          if (crit.length) get().toast('errore', crit[0].messaggio)
        },
        rimuovi: (cat, id) => {
          const p = attivo()
          if (!p) return
          modifica((x) => ({ ...x, sel: senzaComponente(x.sel, cat, id) }))
          get().toast('info', 'Componente rimosso dalla build.')
        },
        resetBuild: () => {
          modifica((x) => ({ ...x, sel: selezioneVuota(), presetId: undefined, rgb: { ...RGB_DEFAULT, bersagli: { ...RGB_DEFAULT.bersagli } }, gpuVerticale: false }))
          set({ esploso: false })
          get().toast('info', 'La build è stata azzerata.')
        },
        applicaPreset: (presetId) => {
          const preset = PRESET.find((x) => x.id === presetId)
          if (!preset) return
          if (!attivo()) get().creaProgetto(preset.nome, undefined, false)
          modifica((x) => ({
            ...x,
            sel: { ...preset.sel, ssd: [...preset.sel.ssd], ventole: [...preset.sel.ventole], cavi: [...preset.sel.cavi] },
            rgb: { ...preset.rgb, bersagli: { ...preset.rgb.bersagli } },
            gpuVerticale: !!preset.gpuVerticale,
            presetId: preset.id,
          }))
          set({ pagina: 'pc' })
          get().toast('successo', `Preset "${preset.nome}" caricato: puoi personalizzare ogni componente.`)
        },
        setRgb: (p) => modifica((x) => ({ ...x, rgb: { ...x.rgb, ...p } })),
        setBersaglio: (k, v) => modifica((x) => ({ ...x, rgb: { ...x.rgb, bersagli: { ...x.rgb.bersagli, [k]: v } } })),
        setGpuVerticale: (v) => modifica((x) => ({ ...x, gpuVerticale: v })),
        salva: () => {
          const { activeId } = get()
          set((s) => ({ projects: s.projects.map((p) => (p.id === activeId ? { ...p, salvato: true, aggiornato: new Date().toISOString() } : p)) }))
          get().toast('successo', 'Build salvata nel tuo account su questo dispositivo.')
        },
        setMiniatura: (id, dataUrl) => set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, miniatura: dataUrl } : p)) })),
        setPref: (p) => set((s) => ({ pref: { ...s.pref, ...p } })),
        toggleEsploso: () => set((s) => ({ esploso: !s.esploso })),
        vista: (v) => set((s) => ({ vistaReq: { id: s.vistaReq.id + 1, vista: v }, vistaCorrente: v })),

        creaAccount: (nome, email) => {
          set({ account: { nome: nome.trim(), email: email.trim(), creatoIl: new Date().toISOString(), provider: 'locale' } })
          get().toast('successo', `Benvenuto, ${nome.trim()}! Il tuo profilo è stato creato.`)
        },
        accediGoogle: (g) => {
          const nuovo = !get().account
          set((s) => ({ account: { nome: g.nome, email: g.email, foto: g.foto, provider: 'google', creatoIl: s.account?.creatoIl ?? new Date().toISOString() } }))
          get().toast('successo', nuovo ? `Benvenuto, ${g.nome}! Registrazione con Google completata.` : `Bentornato, ${g.nome}!`)
        },
        aggiornaAccount: (nome, email) => {
          set((s) => (s.account ? { account: { ...s.account, nome: nome.trim(), email: email.trim() } } : {}))
          get().toast('successo', 'Profilo aggiornato.')
        },
        esci: () => {
          set({ account: null })
          get().toast('info', 'Hai chiuso la sessione del profilo. I progetti restano su questo dispositivo.')
        },
        eliminaTutto: () => {
          set({ account: null, projects: [], activeId: null, confronto: [], pagina: 'home' })
          get().toast('info', 'Tutti i dati locali sono stati eliminati.')
        },
      }
    },
    {
      name: 'componi-il-tuo-pc-v1',
      version: 1,
      partialize: (s) => ({ account: s.account, projects: s.projects, activeId: s.activeId, pref: s.pref }),
    },
  ),
)

export const useProgettoAttivo = (): Progetto | undefined => useStore((s) => s.projects.find((p) => p.id === s.activeId))
