import { Box, CircuitBoard, Cpu, Fan, Gauge, HardDrive, MemoryStick, PcCase, Cable, Zap, Droplets } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Categoria, Componente } from '../types'
import { ex } from './hardware'

export interface MetaCategoria {
  etichetta: string
  breve: string
  descrizione: string
  icona: LucideIcon
}

export const META: Record<Categoria, MetaCategoria> = {
  case: { etichetta: 'Case', breve: 'Case', descrizione: 'La struttura che ospita tutto: determina formato, spazio per GPU e dissipatori, radiatori e flusso d’aria.', icona: PcCase },
  'scheda-madre': { etichetta: 'Scheda Madre', breve: 'Scheda Madre', descrizione: 'Collega ogni componente: socket, tipo di RAM, formato e slot M.2 dipendono da lei.', icona: CircuitBoard },
  cpu: { etichetta: 'Processore (CPU)', breve: 'CPU', descrizione: 'Il cervello del PC: scegli core, frequenza e socket in base all’uso che ne farai.', icona: Cpu },
  gpu: { etichetta: 'Scheda Video (GPU)', breve: 'GPU', descrizione: 'Gestisce grafica, gaming e calcolo parallelo. Controlla lunghezza, consumo e connettori.', icona: Gauge },
  ram: { etichetta: 'Memoria RAM', breve: 'RAM', descrizione: 'Memoria di lavoro: tipo, frequenza e capacità influenzano reattività e multitasking.', icona: MemoryStick },
  dissipatore: { etichetta: 'Dissipatore', breve: 'Dissipatore', descrizione: 'Mantiene fresca la CPU: ad aria, semplice e affidabile, oppure a liquido AIO, più compatto e scenografico.', icona: Droplets },
  ssd: { etichetta: 'Archiviazione (SSD)', breve: 'SSD', descrizione: 'Sistema operativo, giochi e progetti: scegli tra NVMe velocissimi e SATA economici.', icona: HardDrive },
  alimentatore: { etichetta: 'Alimentatore (PSU)', breve: 'Alimentatore', descrizione: 'Fornisce energia stabile a tutto il sistema: potenza, certificazione e connettori contano.', icona: Zap },
  ventole: { etichetta: 'Ventole', breve: 'Ventole', descrizione: 'Garantiscono il flusso d’aria: più ventole, temperature più basse e rumore più contenuto.', icona: Fan },
  cavi: { etichetta: 'Cavi e Accessori', breve: 'Cavi e Accessori', descrizione: 'Cavi intrecciati, adattatori 12VHPWR, hub RGB e supporti per un montaggio ordinato.', icona: Cable },
}

export const ICONA_GENERICA = Box

/* ---------------------------------------------------------------- filtri */

export type TipoFiltro = 'scelta' | 'booleano' | 'intervallo'
export interface FiltroDef {
  chiave: string
  etichetta: string
  tipo: TipoFiltro
  unita?: string
  valore: (c: Componente) => string | number | boolean | string[] | undefined
}

const comuni: FiltroDef[] = [
  { chiave: 'marca', etichetta: 'Marca', tipo: 'scelta', valore: (c) => c.marca },
  { chiave: 'fascia', etichetta: 'Fascia di prodotto', tipo: 'scelta', valore: (c) => c.fascia },
  { chiave: 'colore', etichetta: 'Colore', tipo: 'scelta', valore: (c) => c.colore },
  { chiave: 'prezzo', etichetta: 'Fascia di prezzo', tipo: 'intervallo', unita: '€', valore: (c) => c.prezzo },
]

const radLabel = (c: Componente) =>
  c.supportoRadiatore.map((s) => {
    const [pos, size] = s.split('-')
    return `${pos[0].toUpperCase()}${pos.slice(1)} ${size}`
  })

export const FILTRI: Record<Categoria, FiltroDef[]> = {
  case: [
    { chiave: 'formati', etichetta: 'Formato supportato', tipo: 'scelta', valore: (c) => c.compatibilita },
    { chiave: 'gpuMax', etichetta: 'Lunghezza max GPU', tipo: 'intervallo', unita: 'mm', valore: (c) => c.lunghezzaMaxGpuCaseMm ?? undefined },
    { chiave: 'coolMax', etichetta: 'Altezza max dissipatore', tipo: 'intervallo', unita: 'mm', valore: (c) => c.altezzaMaxDissipatoreCaseMm ?? undefined },
    { chiave: 'rad', etichetta: 'Supporto radiatore', tipo: 'scelta', valore: radLabel },
    { chiave: 'ventoleIncluse', etichetta: 'Ventole incluse', tipo: 'intervallo', valore: (c) => c.numeroVentole ?? 0 },
    { chiave: 'vetro', etichetta: 'Pannello in vetro temperato', tipo: 'booleano', valore: (c) => ex.b(c, 'vetro') },
    { chiave: 'usbC', etichetta: 'USB-C frontale', tipo: 'booleano', valore: (c) => ex.b(c, 'usbC') },
    { chiave: 'gpuVert', etichetta: 'Supporto GPU verticale', tipo: 'booleano', valore: (c) => ex.b(c, 'gpuVerticale') },
    { chiave: 'dual', etichetta: 'Dual chamber', tipo: 'booleano', valore: (c) => ex.s(c, 'stile') === 'dual' },
    ...comuni,
  ],
  'scheda-madre': [
    { chiave: 'socket', etichetta: 'Socket', tipo: 'scelta', valore: (c) => c.socket ?? undefined },
    { chiave: 'formato', etichetta: 'Formato', tipo: 'scelta', valore: (c) => c.formato ?? undefined },
    { chiave: 'chipset', etichetta: 'Chipset', tipo: 'scelta', valore: (c) => ex.s(c, 'chipset') },
    { chiave: 'tipoRam', etichetta: 'RAM supportata', tipo: 'scelta', valore: (c) => c.tipoRam ?? undefined },
    { chiave: 'slotRam', etichetta: 'Slot RAM', tipo: 'scelta', valore: (c) => String(ex.n(c, 'slotRam')) },
    { chiave: 'slotM2', etichetta: 'Slot M.2', tipo: 'scelta', valore: (c) => String(ex.n(c, 'slotM2')) },
    { chiave: 'wifi', etichetta: 'Wi-Fi', tipo: 'booleano', valore: (c) => ex.b(c, 'wifi') },
    { chiave: 'bt', etichetta: 'Bluetooth', tipo: 'booleano', valore: (c) => ex.b(c, 'bluetooth') },
    { chiave: 'pcie5', etichetta: 'PCIe 5.0', tipo: 'booleano', valore: (c) => ex.b(c, 'pcie5') },
    { chiave: 'usbC', etichetta: 'USB-C frontale', tipo: 'booleano', valore: (c) => ex.b(c, 'usbC') },
    { chiave: 'vrm', etichetta: 'Dissipatori VRM', tipo: 'booleano', valore: (c) => ex.b(c, 'vrm') },
    { chiave: 'audio', etichetta: 'Audio di fascia alta', tipo: 'booleano', valore: (c) => ex.b(c, 'audioPremium') },
    ...comuni,
  ],
  cpu: [
    { chiave: 'socket', etichetta: 'Socket', tipo: 'scelta', valore: (c) => c.socket ?? undefined },
    { chiave: 'serie', etichetta: 'Serie', tipo: 'scelta', valore: (c) => ex.s(c, 'serie') },
    { chiave: 'core', etichetta: 'Numero di core', tipo: 'intervallo', valore: (c) => ex.n(c, 'core') },
    { chiave: 'thread', etichetta: 'Numero di thread', tipo: 'intervallo', valore: (c) => ex.n(c, 'thread') },
    { chiave: 'freq', etichetta: 'Frequenza massima', tipo: 'intervallo', unita: 'GHz', valore: (c) => ex.n(c, 'freq') },
    { chiave: 'tdp', etichetta: 'Consumo massimo', tipo: 'intervallo', unita: 'W', valore: (c) => c.wattaggio },
    { chiave: 'igpu', etichetta: 'Grafica integrata', tipo: 'booleano', valore: (c) => ex.b(c, 'igpu') },
    { chiave: 'oc', etichetta: 'Overclock', tipo: 'booleano', valore: (c) => ex.b(c, 'overclock') },
    { chiave: 'pcie5', etichetta: 'PCIe 5.0', tipo: 'booleano', valore: (c) => ex.b(c, 'pcie5') },
    { chiave: 'ddr5', etichetta: 'Supporto DDR5', tipo: 'booleano', valore: (c) => ex.b(c, 'ddr5') },
    ...comuni,
  ],
  gpu: [
    { chiave: 'serie', etichetta: 'Serie', tipo: 'scelta', valore: (c) => ex.s(c, 'serie') },
    { chiave: 'vram', etichetta: 'Memoria video', tipo: 'scelta', valore: (c) => `${ex.n(c, 'vram')}GB` },
    { chiave: 'lunghezza', etichetta: 'Lunghezza', tipo: 'intervallo', unita: 'mm', valore: (c) => c.lunghezzaGpuMm ?? undefined },
    { chiave: 'ventole', etichetta: 'Numero di ventole', tipo: 'scelta', valore: (c) => String(ex.n(c, 'ventole')) },
    { chiave: 'watt', etichetta: 'Consumo', tipo: 'intervallo', unita: 'W', valore: (c) => c.wattaggio },
    { chiave: 'conn', etichetta: 'Connettori PCIe richiesti', tipo: 'scelta', valore: (c) => String(c.connettoriPCIe ?? 0) },
    { chiave: 'rt', etichetta: 'Ray tracing', tipo: 'booleano', valore: (c) => ex.b(c, 'rt') },
    { chiave: 'dlss', etichetta: 'Supporto DLSS', tipo: 'booleano', valore: (c) => ex.b(c, 'dlss') },
    { chiave: 'fsr', etichetta: 'Supporto FSR', tipo: 'booleano', valore: (c) => ex.b(c, 'fsr') },
    { chiave: 'rgb', etichetta: 'RGB', tipo: 'booleano', valore: (c) => ex.b(c, 'rgb') },
    { chiave: 'backplate', etichetta: 'Backplate', tipo: 'booleano', valore: (c) => ex.b(c, 'backplate') },
    ...comuni,
  ],
  ram: [
    { chiave: 'tipo', etichetta: 'Tipo', tipo: 'scelta', valore: (c) => c.tipoRam ?? undefined },
    { chiave: 'cap', etichetta: 'Capacità totale', tipo: 'scelta', valore: (c) => c.capacita ?? undefined },
    { chiave: 'conf', etichetta: 'Configurazione', tipo: 'scelta', valore: (c) => ex.s(c, 'configurazione') },
    { chiave: 'freq', etichetta: 'Frequenza', tipo: 'scelta', valore: (c) => `${ex.n(c, 'frequenza')}MHz` },
    { chiave: 'lat', etichetta: 'Latenza CL', tipo: 'intervallo', valore: (c) => ex.n(c, 'latenza') },
    { chiave: 'altezza', etichetta: 'Altezza modulo', tipo: 'intervallo', unita: 'mm', valore: (c) => ex.n(c, 'altezzaMm') },
    { chiave: 'rgb', etichetta: 'RGB', tipo: 'booleano', valore: (c) => ex.b(c, 'rgb') },
    { chiave: 'xmp', etichetta: 'Compatibile XMP', tipo: 'booleano', valore: (c) => ex.b(c, 'xmp') },
    { chiave: 'expo', etichetta: 'Compatibile EXPO', tipo: 'booleano', valore: (c) => ex.b(c, 'expo') },
    ...comuni,
  ],
  dissipatore: [
    { chiave: 'tipo', etichetta: 'Tipo', tipo: 'scelta', valore: (c) => (c.formato === 'AIO' ? 'AIO liquido' : 'Aria') },
    { chiave: 'rad', etichetta: 'Formato radiatore', tipo: 'scelta', valore: (c) => (c.formatoRadiatore ? `${c.formatoRadiatore}mm` : undefined) },
    { chiave: 'altezza', etichetta: 'Altezza (ad aria)', tipo: 'intervallo', unita: 'mm', valore: (c) => c.altezzaDissipatoreMm ?? undefined },
    { chiave: 'tdp', etichetta: 'Capacità di dissipazione', tipo: 'intervallo', unita: 'W', valore: (c) => ex.n(c, 'tdpMax') },
    { chiave: 'rumore', etichetta: 'Rumorosità', tipo: 'intervallo', unita: 'dB', valore: (c) => ex.n(c, 'rumore') },
    { chiave: 'ventole', etichetta: 'Ventole incluse', tipo: 'intervallo', valore: (c) => c.numeroVentole ?? 0 },
    { chiave: 'rgb', etichetta: 'RGB', tipo: 'booleano', valore: (c) => ex.b(c, 'rgb') },
    { chiave: 'pompa', etichetta: 'Pompa', tipo: 'booleano', valore: (c) => ex.b(c, 'pompa') },
    { chiave: 'display', etichetta: 'Display sulla pompa', tipo: 'booleano', valore: (c) => ex.b(c, 'display') },
    ...comuni,
  ],
  ssd: [
    { chiave: 'formato', etichetta: 'Formato', tipo: 'scelta', valore: (c) => c.formato ?? undefined },
    { chiave: 'cap', etichetta: 'Capacità', tipo: 'scelta', valore: (c) => c.capacita ?? undefined },
    { chiave: 'iface', etichetta: 'Interfaccia', tipo: 'scelta', valore: (c) => ex.s(c, 'interfaccia') },
    { chiave: 'lettura', etichetta: 'Velocità di lettura', tipo: 'intervallo', unita: 'MB/s', valore: (c) => ex.n(c, 'lettura') },
    { chiave: 'scrittura', etichetta: 'Velocità di scrittura', tipo: 'intervallo', unita: 'MB/s', valore: (c) => ex.n(c, 'scrittura') },
    { chiave: 'heat', etichetta: 'Dissipatore / heatsink', tipo: 'booleano', valore: (c) => ex.b(c, 'dissipatore') },
    { chiave: 'tipologia', etichetta: 'Tipologia', tipo: 'scelta', valore: (c) => ex.s(c, 'tipologia') },
    ...comuni,
  ],
  alimentatore: [
    { chiave: 'watt', etichetta: 'Wattaggio', tipo: 'scelta', valore: (c) => `${c.wattaggio}W` },
    { chiave: 'cert', etichetta: 'Certificazione', tipo: 'scelta', valore: (c) => c.certificazione ?? undefined },
    { chiave: 'formato', etichetta: 'Formato', tipo: 'scelta', valore: (c) => c.formato ?? undefined },
    { chiave: 'mod', etichetta: 'Modularità', tipo: 'scelta', valore: (c) => ex.s(c, 'modularita') },
    { chiave: 'pcie', etichetta: 'Connettori PCIe', tipo: 'intervallo', valore: (c) => c.connettoriPCIe ?? 0 },
    { chiave: 'nativo', etichetta: 'Cavo 12VHPWR nativo', tipo: 'booleano', valore: (c) => ex.b(c, 'nativo12vhpwr') },
    { chiave: 'zero', etichetta: 'Modalità Zero RPM', tipo: 'booleano', valore: (c) => ex.b(c, 'zeroRpm') },
    { chiave: 'prot', etichetta: 'Protezioni avanzate', tipo: 'booleano', valore: (c) => ex.b(c, 'protezioniAvanzate') },
    ...comuni,
  ],
  ventole: [
    { chiave: 'dim', etichetta: 'Dimensione', tipo: 'scelta', valore: (c) => `${ex.n(c, 'dimensione')}mm` },
    { chiave: 'tipo', etichetta: 'Tipo', tipo: 'scelta', valore: (c) => ex.s(c, 'tipo') },
    { chiave: 'flusso', etichetta: 'Flusso d’aria', tipo: 'intervallo', unita: 'CFM', valore: (c) => ex.n(c, 'flusso') },
    { chiave: 'rumore', etichetta: 'Rumorosità', tipo: 'intervallo', unita: 'dB', valore: (c) => ex.n(c, 'rumore') },
    { chiave: 'pezzi', etichetta: 'Ventole nel set', tipo: 'intervallo', valore: (c) => c.numeroVentole ?? 1 },
    { chiave: 'hub', etichetta: 'Hub incluso', tipo: 'booleano', valore: (c) => ex.b(c, 'hub') },
    { chiave: 'pwm', etichetta: 'Controllo PWM', tipo: 'booleano', valore: (c) => ex.b(c, 'pwm') },
    { chiave: 'reverse', etichetta: 'Reverse blade', tipo: 'booleano', valore: (c) => ex.b(c, 'reverse') },
    ...comuni,
  ],
  cavi: [
    { chiave: 'tipo', etichetta: 'Tipologia', tipo: 'scelta', valore: (c) => ex.s(c, 'tipo') },
    { chiave: 'lung', etichetta: 'Lunghezza', tipo: 'intervallo', unita: 'mm', valore: (c) => ex.n(c, 'lunghezza') },
    { chiave: 'sleeving', etichetta: 'Sleeving', tipo: 'booleano', valore: (c) => ex.b(c, 'sleeving') },
    { chiave: 'hvpwr', etichetta: 'Connettori 12VHPWR', tipo: 'booleano', valore: (c) => ex.b(c, 'hvpwr') },
    { chiave: 'supportoGpu', etichetta: 'Supporto GPU', tipo: 'booleano', valore: (c) => ex.b(c, 'supportoGpu') },
    { chiave: 'hubRgb', etichetta: 'Hub RGB', tipo: 'booleano', valore: (c) => ex.b(c, 'hubRgb') },
    ...comuni,
  ],
}

export const SUGGERIMENTI_RICERCA = ['RTX 5080', 'Ryzen 7', 'DDR5 6000', 'AIO 360', '850W', 'Bianco', 'SSD 2TB', 'ATX', 'AM5', 'PCIe 5.0', 'Silenzioso', 'RGB', 'White Edition', 'Workstation']

/* ---------------------------------------------------- specifiche complete */

const sn = (b: boolean) => (b ? 'Sì' : 'No')

export function specifiche(c: Componente): [string, string][] {
  const base: [string, string][] = [
    ['Marca', c.marca],
    ['Colore', c.colore],
    ['Fascia di prodotto', c.fascia],
    ['Anno di uscita', String(c.anno)],
  ]
  const r: [string, string][] = []
  switch (c.categoria) {
    case 'case':
      r.push(['Dimensioni (L × A × P)', `${ex.n(c, 'larghezza')} × ${ex.n(c, 'altezza')} × ${ex.n(c, 'profondita')} mm`], ['Formati scheda madre', c.compatibilita.join(', ')], ['Lunghezza max GPU', `${c.lunghezzaMaxGpuCaseMm} mm`], ['Altezza max dissipatore', `${c.altezzaMaxDissipatoreCaseMm} mm`], ['Supporto radiatori', radLabel(c).join(', ') || 'Nessuno'], ['Ventole incluse', String(c.numeroVentole ?? 0)], ['Posizioni ventole', String(ex.n(c, 'slotVentole'))], ['Slot PCIe', String(ex.n(c, 'slotPcie'))], ['Alimentatore', ex.s(c, 'psu')], ['Vetro temperato', sn(ex.b(c, 'vetro'))], ['USB-C frontale', sn(ex.b(c, 'usbC'))], ['GPU verticale', sn(ex.b(c, 'gpuVerticale'))])
      break
    case 'scheda-madre':
      r.push(['Socket', c.socket ?? '—'], ['Chipset', ex.s(c, 'chipset')], ['Formato', c.formato ?? '—'], ['Memoria supportata', c.tipoRam ?? '—'], ['Slot RAM', String(ex.n(c, 'slotRam'))], ['Slot M.2', String(ex.n(c, 'slotM2'))], ['Wi-Fi e Bluetooth', sn(ex.b(c, 'wifi'))], ['PCIe 5.0', sn(ex.b(c, 'pcie5'))], ['USB-C frontale', sn(ex.b(c, 'usbC'))], ['Dissipatori VRM', sn(ex.b(c, 'vrm'))], ['Consumo stimato', `${c.wattaggio} W`])
      break
    case 'cpu':
      r.push(['Socket', c.socket ?? '—'], ['Core / Thread', `${ex.n(c, 'core')} / ${ex.n(c, 'thread')}`], ['Frequenza massima', `${ex.n(c, 'freq')} GHz`], ['Consumo massimo', `${c.wattaggio} W`], ['Grafica integrata', sn(ex.b(c, 'igpu'))], ['Overclock', sn(ex.b(c, 'overclock'))], ['Supporto DDR5', sn(ex.b(c, 'ddr5'))], ['Dissipatore incluso', sn(ex.b(c, 'coolerIncluso'))])
      break
    case 'gpu':
      r.push(['Chip', ex.s(c, 'chip')], ['Memoria video', `${ex.n(c, 'vram')} GB`], ['Lunghezza', `${c.lunghezzaGpuMm} mm`], ['Spessore', `${ex.n(c, 'slot')} slot`], ['Ventole', String(ex.n(c, 'ventole'))], ['Consumo', `${c.wattaggio} W`], ['Connettori PCIe (8 pin eq.)', String(c.connettoriPCIe)], ['Connettore 12VHPWR', sn(ex.b(c, 'richiede12vhpwr'))], ['DLSS / FSR', `${sn(ex.b(c, 'dlss'))} / ${sn(ex.b(c, 'fsr'))}`], ['RGB', sn(ex.b(c, 'rgb'))])
      break
    case 'ram':
      r.push(['Tipo', c.tipoRam ?? '—'], ['Capacità', c.capacita ?? '—'], ['Configurazione', ex.s(c, 'configurazione')], ['Frequenza', `${ex.n(c, 'frequenza')} MHz`], ['Latenza', `CL${ex.n(c, 'latenza')}`], ['Altezza modulo', `${ex.n(c, 'altezzaMm')} mm`], ['RGB', sn(ex.b(c, 'rgb'))], ['XMP / EXPO', `${sn(ex.b(c, 'xmp'))} / ${sn(ex.b(c, 'expo'))}`], ['Consumo stimato', `${c.wattaggio} W`])
      break
    case 'dissipatore':
      r.push(['Tipo', c.formato === 'AIO' ? 'AIO liquido' : 'Aria'], c.formato === 'AIO' ? ['Radiatore', `${c.formatoRadiatore} mm`] : ['Altezza', `${c.altezzaDissipatoreMm} mm`], ['Capacità di dissipazione', `${ex.n(c, 'tdpMax')} W`], ['Rumorosità', `${ex.n(c, 'rumore')} dB`], ['Ventole incluse', String(c.numeroVentole)], ['Socket supportati', c.compatibilita.join(', ')], ['RGB', sn(ex.b(c, 'rgb'))], ['Display', sn(ex.b(c, 'display'))])
      break
    case 'ssd':
      r.push(['Formato', c.formato ?? '—'], ['Capacità', c.capacita ?? '—'], ['Interfaccia', ex.s(c, 'interfaccia')], ['Lettura', `${ex.n(c, 'lettura')} MB/s`], ['Scrittura', `${ex.n(c, 'scrittura')} MB/s`], ['Dissipatore', sn(ex.b(c, 'dissipatore'))], ['Tipologia', ex.s(c, 'tipologia')], ['Consumo stimato', `${c.wattaggio} W`])
      break
    case 'alimentatore':
      r.push(['Potenza', `${c.wattaggio} W`], ['Certificazione', c.certificazione ?? '—'], ['Formato', c.formato ?? '—'], ['Modularità', ex.s(c, 'modularita')], ['Connettori PCIe', String(c.connettoriPCIe)], ['Cavo 12VHPWR nativo', sn(ex.b(c, 'nativo12vhpwr'))], ['Zero RPM', sn(ex.b(c, 'zeroRpm'))])
      break
    case 'ventole':
      r.push(['Ventole nel set', String(c.numeroVentole)], ['Dimensione', `${ex.n(c, 'dimensione')} mm`], ['Tipo', ex.s(c, 'tipo')], ['Flusso d’aria', `${ex.n(c, 'flusso')} CFM`], ['Rumorosità', `${ex.n(c, 'rumore')} dB`], ['Hub incluso', sn(ex.b(c, 'hub'))], ['Controllo PWM', sn(ex.b(c, 'pwm'))])
      break
    case 'cavi':
      r.push(['Tipologia', ex.s(c, 'tipo')], ['Lunghezza', ex.n(c, 'lunghezza') ? `${ex.n(c, 'lunghezza')} mm` : '—'], ['Sleeving', sn(ex.b(c, 'sleeving'))], ['12VHPWR', sn(ex.b(c, 'hvpwr'))])
      break
  }
  return [...r, ...base]
}

/** Specifica chiave in una riga, per card e riepilogo. */
export function specChiave(c: Componente): string {
  switch (c.categoria) {
    case 'case': return `${c.compatibilita[c.compatibilita.length - 1] === 'E-ATX' ? 'E-ATX' : c.compatibilita[c.compatibilita.length - 1]} · GPU ${c.lunghezzaMaxGpuCaseMm} mm`
    case 'scheda-madre': return `${c.socket} · ${c.formato} · ${c.tipoRam}`
    case 'cpu': return `${ex.n(c, 'core')} core · ${ex.n(c, 'freq')} GHz · ${c.socket}`
    case 'gpu': return `${ex.n(c, 'vram')} GB · ${c.lunghezzaGpuMm} mm · ${c.wattaggio} W`
    case 'ram': return `${c.capacita} ${c.tipoRam} · ${ex.n(c, 'frequenza')} MHz`
    case 'dissipatore': return c.formato === 'AIO' ? `AIO ${c.formatoRadiatore} mm · ${ex.n(c, 'tdpMax')} W` : `Aria ${c.altezzaDissipatoreMm} mm · ${ex.n(c, 'tdpMax')} W`
    case 'ssd': return `${c.capacita} · ${ex.s(c, 'interfaccia')}`
    case 'alimentatore': return `${c.wattaggio} W · ${c.certificazione?.replace('80 Plus ', '')} · ${c.formato}`
    case 'ventole': return `${c.numeroVentole}× ${ex.n(c, 'dimensione')} mm · ${ex.s(c, 'tipo')}`
    case 'cavi': return ex.s(c, 'tipo')
  }
}
