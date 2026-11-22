// Tipi condivisi dell'applicazione

export type Categoria =
  | 'case'
  | 'scheda-madre'
  | 'cpu'
  | 'gpu'
  | 'ram'
  | 'dissipatore'
  | 'ssd'
  | 'alimentatore'
  | 'ventole'
  | 'cavi'

export const CATEGORIE: Categoria[] = [
  'case',
  'scheda-madre',
  'cpu',
  'gpu',
  'ram',
  'dissipatore',
  'ssd',
  'alimentatore',
  'ventole',
  'cavi',
]

/** Categorie che accettano più componenti nella stessa build. */
export const CATEGORIE_MULTIPLE: Categoria[] = ['ssd', 'ventole', 'cavi']

export type Fascia = 'Entry Level' | 'Mid Range' | 'High End' | 'Enthusiast'

export type Extra = Record<string, number | string | boolean>

export interface Componente {
  id: string
  categoria: Categoria
  marca: string
  modello: string
  nome: string
  /** Prezzo in euro (indicativo) */
  prezzo: number
  /** Consumo in watt; per gli alimentatori è la potenza erogabile */
  wattaggio: number
  colore: string
  socket: string | null
  tipoRam: string | null
  formato: string | null
  capacita: string | null
  lunghezzaGpuMm: number | null
  lunghezzaMaxGpuCaseMm: number | null
  altezzaDissipatoreMm: number | null
  altezzaMaxDissipatoreCaseMm: number | null
  formatoRadiatore: string | null
  supportoRadiatore: string[]
  numeroVentole: number | null
  connettoriPCIe: number | null
  certificazione: string | null
  descrizione: string
  tag: string[]
  immagine: string | null
  modello3D: string
  compatibilita: string[]
  fascia: Fascia
  anno: number
  popolarita: number
  valutazione: 'Buono' | 'Molto buono' | 'Ottimo' | 'Eccellente'
  extra: Extra
}

export type EffettoRgb =
  | 'statico'
  | 'respiro'
  | 'onda'
  | 'arcobaleno'
  | 'polso'
  | 'reazione'
  | 'cascata'
  | 'aurora'
  | 'color-shift'

export interface ImpostazioniRgb {
  attivo: boolean
  effetto: EffettoRgb
  palette: string
  colore: string
  intensita: number
  velocita: number
  bersagli: { ram: boolean; ventole: boolean; gpu: boolean; dissipatore: boolean }
}

export interface Selezione {
  case?: string
  'scheda-madre'?: string
  cpu?: string
  gpu?: string
  ram?: string
  dissipatore?: string
  alimentatore?: string
  ssd: string[]
  ventole: string[]
  cavi: string[]
}

export interface Progetto {
  id: string
  nome: string
  creato: string
  aggiornato: string
  salvato: boolean
  sel: Selezione
  rgb: ImpostazioniRgb
  gpuVerticale: boolean
  presetId?: string
  miniatura?: string
}

export type Gravita = 'critico' | 'attenzione' | 'info'

export interface Problema {
  id: string
  gravita: Gravita
  categoria: Categoria
  messaggio: string
  componenti: string[]
  suggerimento?: string
}

export type StatoBuild =
  | 'Build non valida'
  | 'Configurazione incompleta'
  | 'Build da verificare'
  | 'Build valida'
  | 'Build ottimizzata'

export type StatoCategoria =
  | 'Mancante'
  | 'Selezionato'
  | 'Incompatibile'
  | 'Opzionale'
  | 'Da verificare'
  | 'Completato'
  | 'Consigliato'
  | 'Critico'

export type Pagina = 'home' | 'componenti' | 'pc' | 'account'

export interface Account {
  nome: string
  email: string
  creatoIl: string
}
