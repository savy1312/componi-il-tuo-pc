import type { Categoria, Componente, Extra, Fascia } from '../types'

/*
 * Database hardware (prezzi e specifiche indicativi, a scopo dimostrativo).
 * I prodotti sono ispirati a marche reali; le descrizioni sono originali.
 * Per estendere il catalogo basta aggiungere una riga alle liste qui sotto.
 */

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h >>> 0)
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

function crea(p: Partial<Componente> & Pick<Componente, 'categoria' | 'marca' | 'modello' | 'prezzo' | 'descrizione'>): Componente {
  const nome = p.nome ?? `${p.marca} ${p.modello}`
  const id = p.id ?? slug(`${nome} ${p.colore ?? ''}`)
  const h = hash(id)
  return {
    id,
    categoria: p.categoria,
    marca: p.marca,
    modello: p.modello,
    nome,
    prezzo: p.prezzo,
    wattaggio: p.wattaggio ?? 0,
    colore: p.colore ?? 'Nero',
    socket: p.socket ?? null,
    tipoRam: p.tipoRam ?? null,
    formato: p.formato ?? null,
    capacita: p.capacita ?? null,
    lunghezzaGpuMm: p.lunghezzaGpuMm ?? null,
    lunghezzaMaxGpuCaseMm: p.lunghezzaMaxGpuCaseMm ?? null,
    altezzaDissipatoreMm: p.altezzaDissipatoreMm ?? null,
    altezzaMaxDissipatoreCaseMm: p.altezzaMaxDissipatoreCaseMm ?? null,
    formatoRadiatore: p.formatoRadiatore ?? null,
    supportoRadiatore: p.supportoRadiatore ?? [],
    numeroVentole: p.numeroVentole ?? null,
    connettoriPCIe: p.connettoriPCIe ?? null,
    certificazione: p.certificazione ?? null,
    descrizione: p.descrizione,
    tag: p.tag ?? [],
    immagine: null,
    modello3D: p.modello3D ?? `${p.categoria}/standard`,
    compatibilita: p.compatibilita ?? [],
    fascia: 'Mid Range',
    anno: p.anno ?? 2022 + (h % 4),
    popolarita: 40 + (h % 60),
    valutazione: (['Buono', 'Molto buono', 'Ottimo', 'Eccellente'] as const)[(h >> 3) % 4],
    extra: p.extra ?? {},
  }
}

const TUTTI_SOCKET = ['AM5', 'AM4', 'LGA1700', 'LGA1851']

/* ------------------------------------------------------------------ CASE */

interface CaseOpt {
  stile: 'airflow' | 'dual' | 'compact' | 'minimal'
  slotPcie: number
  psu: 'ATX' | 'SFX' | 'ATX/SFX'
  formati: string[]
  vetro?: boolean
  usbC?: boolean
  gpuVert?: boolean
  accent?: string
  slotVentole: number
}
const FMT_STD = ['Mini-ITX', 'Micro-ATX', 'ATX']
const FMT_BIG = ['Mini-ITX', 'Micro-ATX', 'ATX', 'E-ATX']
const STILE_TXT = {
  airflow: 'mid-tower ad alto flusso d’aria',
  dual: 'a doppia camera con ampia vista sull’interno',
  compact: 'compatto per postazioni con poco spazio',
  minimal: 'dal design pulito e silenzioso',
}

function pcCase(
  marca: string,
  modello: string,
  prezzo: number,
  colore: string,
  dim: [number, number, number],
  gpuMax: number,
  coolMax: number,
  rad: string[],
  ventoleIncluse: number,
  o: CaseOpt,
): Componente {
  const vetro = o.vetro ?? true
  const tag = [o.stile === 'airflow' ? 'High Airflow' : o.stile === 'compact' ? 'Compact' : o.stile === 'minimal' ? 'Silenzioso' : 'Dual Chamber']
  if (colore === 'Bianco') tag.push('White Edition')
  if (vetro) tag.push('Vetro temperato')
  o.formati.forEach((f) => f !== 'E-ATX' && tag.push(f))
  return crea({
    categoria: 'case',
    marca,
    modello,
    prezzo,
    colore,
    formato: o.formati[o.formati.length - 1],
    lunghezzaMaxGpuCaseMm: gpuMax,
    altezzaMaxDissipatoreCaseMm: coolMax,
    supportoRadiatore: rad,
    numeroVentole: ventoleIncluse,
    compatibilita: o.formati,
    descrizione: `Case ${STILE_TXT[o.stile]}, ${vetro ? 'con pannello laterale in vetro temperato' : 'con pannelli pieni'}. Accoglie GPU fino a ${gpuMax} mm e dissipatori fino a ${coolMax} mm.`,
    tag,
    modello3D: `case/${o.stile}`,
    extra: {
      larghezza: dim[0],
      altezza: dim[1],
      profondita: dim[2],
      stile: o.stile,
      slotPcie: o.slotPcie,
      psu: o.psu,
      vetro,
      usbC: o.usbC ?? true,
      gpuVerticale: o.gpuVert ?? false,
      accent: o.accent ?? '',
      slotVentole: o.slotVentole,
      gestioneCavi: true,
      filtro: true,
    },
  })
}

const AIR_RAD = ['frontale-360', 'frontale-280', 'frontale-240', 'superiore-240', 'posteriore-120']

const CASES: Componente[] = [
  pcCase('NZXT', 'H7 Flow', 129, 'Nero', [230, 505, 494], 400, 185, ['frontale-360', 'frontale-280', 'frontale-240', 'superiore-360', 'superiore-280', 'superiore-240', 'posteriore-120'], 2, { stile: 'airflow', slotPcie: 7, psu: 'ATX', formati: FMT_STD, slotVentole: 7 }),
  pcCase('NZXT', 'H7 Flow', 139, 'Bianco', [230, 505, 494], 400, 185, ['frontale-360', 'frontale-280', 'frontale-240', 'superiore-360', 'superiore-280', 'superiore-240', 'posteriore-120'], 2, { stile: 'airflow', slotPcie: 7, psu: 'ATX', formati: FMT_STD, slotVentole: 7 }),
  pcCase('Lian Li', 'O11 Dynamic EVO', 169, 'Nero', [285, 465, 459], 426, 167, ['laterale-360', 'laterale-280', 'superiore-360', 'superiore-280', 'posteriore-120'], 0, { stile: 'dual', slotPcie: 8, psu: 'ATX', formati: FMT_BIG, gpuVert: true, slotVentole: 9 }),
  pcCase('Lian Li', 'O11 Dynamic EVO', 179, 'Bianco', [285, 465, 459], 426, 167, ['laterale-360', 'laterale-280', 'superiore-360', 'superiore-280', 'posteriore-120'], 0, { stile: 'dual', slotPcie: 8, psu: 'ATX', formati: FMT_BIG, gpuVert: true, slotVentole: 9 }),
  pcCase('Corsair', '4000D Airflow', 104, 'Nero', [230, 466, 453], 360, 170, AIR_RAD, 2, { stile: 'airflow', slotPcie: 7, psu: 'ATX', formati: FMT_STD, slotVentole: 6 }),
  pcCase('Corsair', '4000D Airflow', 109, 'Bianco', [230, 466, 453], 360, 170, AIR_RAD, 2, { stile: 'airflow', slotPcie: 7, psu: 'ATX', formati: FMT_STD, slotVentole: 6 }),
  pcCase('Fractal Design', 'North', 139, 'Nero', [215, 447, 469], 355, 170, ['frontale-360', 'frontale-280', 'superiore-280', 'superiore-240', 'posteriore-120'], 2, { stile: 'minimal', slotPcie: 7, psu: 'ATX', formati: FMT_STD, accent: '#7a5233', slotVentole: 6 }),
  pcCase('Fractal Design', 'North', 139, 'Bianco', [215, 447, 469], 355, 170, ['frontale-360', 'frontale-280', 'superiore-280', 'superiore-240', 'posteriore-120'], 2, { stile: 'minimal', slotPcie: 7, psu: 'ATX', formati: FMT_STD, accent: '#c8a57c', slotVentole: 6 }),
  pcCase('Fractal Design', 'Torrent', 199, 'Nero', [240, 530, 544], 423, 188, ['frontale-360', 'superiore-360', 'superiore-280', 'posteriore-120'], 5, { stile: 'airflow', slotPcie: 7, psu: 'ATX', formati: FMT_BIG, slotVentole: 8 }),
  pcCase('Lian Li', 'Lancool 216', 99, 'Nero', [245, 478, 495], 392, 180, ['frontale-360', 'frontale-280', 'superiore-360', 'superiore-280', 'posteriore-120'], 2, { stile: 'airflow', slotPcie: 7, psu: 'ATX', formati: FMT_STD, slotVentole: 7 }),
  pcCase('be quiet!', 'Pure Base 500DX', 109, 'Nero', [232, 444, 450], 369, 190, ['frontale-360', 'frontale-280', 'superiore-240', 'posteriore-120'], 3, { stile: 'airflow', slotPcie: 7, psu: 'ATX', formati: FMT_STD, slotVentole: 6 }),
  pcCase('Corsair', '5000D Airflow', 169, 'Nero', [245, 520, 520], 420, 170, ['frontale-360', 'frontale-280', 'superiore-360', 'superiore-280', 'posteriore-120'], 2, { stile: 'airflow', slotPcie: 7, psu: 'ATX', formati: FMT_BIG, slotVentole: 8 }),
  pcCase('NZXT', 'H5 Flow', 99, 'Bianco', [230, 464, 450], 365, 165, ['frontale-280', 'frontale-240', 'superiore-240', 'posteriore-120'], 2, { stile: 'airflow', slotPcie: 7, psu: 'ATX', formati: FMT_STD, slotVentole: 5 }),
  pcCase('Cooler Master', 'NR200P', 119, 'Bianco', [160, 376, 292], 330, 155, ['laterale-280', 'laterale-240'], 2, { stile: 'compact', slotPcie: 3, psu: 'SFX', formati: ['Mini-ITX'], slotVentole: 4, vetro: true }),
  pcCase('Fractal Design', 'Terra', 189, 'Nero', [180, 385, 300], 322, 77, [], 0, { stile: 'compact', slotPcie: 3, psu: 'SFX', formati: ['Mini-ITX'], accent: '#8b5a35', slotVentole: 2, vetro: false }),
  pcCase('Hyte', 'Y60', 199, 'Bianco', [250, 480, 480], 422, 180, ['frontale-360', 'superiore-360', 'laterale-360'], 0, { stile: 'dual', slotPcie: 7, psu: 'ATX', formati: FMT_BIG, gpuVert: true, slotVentole: 9 }),
]

/* ---------------------------------------------------------- SCHEDE MADRI */

interface MoboOpt {
  chipset: string
  slotRam: number
  slotM2: number
  wifi: boolean
  pcie5: boolean
  colore?: string
  vrm?: boolean
}
function mobo(marca: string, modello: string, prezzo: number, socket: string, tipoRam: string, formato: string, o: MoboOpt): Componente {
  const tag = [formato, tipoRam, socket]
  if (o.pcie5) tag.push('PCIe 5.0')
  if (o.wifi) tag.push('Wi-Fi')
  if (o.colore === 'Bianco') tag.push('White Edition')
  return crea({
    categoria: 'scheda-madre',
    marca,
    modello,
    prezzo,
    colore: o.colore ?? 'Nero',
    socket,
    tipoRam,
    formato,
    wattaggio: formato === 'Mini-ITX' ? 25 : 35,
    descrizione: `Scheda madre ${formato} per socket ${socket} con memoria ${tipoRam}, ${o.slotM2} slot M.2 e chipset ${o.chipset}${o.wifi ? '. Wi-Fi e Bluetooth integrati' : ''}.`,
    tag,
    modello3D: `scheda-madre/${formato}`,
    compatibilita: [socket, tipoRam],
    extra: { chipset: o.chipset, slotRam: o.slotRam, slotM2: o.slotM2, wifi: o.wifi, bluetooth: o.wifi, pcie5: o.pcie5, vrm: prezzo > 200, usbC: prezzo > 150, audioPremium: prezzo > 300 },
  })
}

const MOBO: Componente[] = [
  mobo('ASUS ROG', 'Strix B650E-F Gaming WiFi', 329, 'AM5', 'DDR5', 'ATX', { chipset: 'B650E', slotRam: 4, slotM2: 3, wifi: true, pcie5: true }),
  mobo('MSI', 'MAG B650 Tomahawk WiFi', 229, 'AM5', 'DDR5', 'ATX', { chipset: 'B650', slotRam: 4, slotM2: 2, wifi: true, pcie5: false }),
  mobo('Gigabyte', 'B650 Aorus Elite AX', 219, 'AM5', 'DDR5', 'ATX', { chipset: 'B650', slotRam: 4, slotM2: 3, wifi: true, pcie5: true }),
  mobo('ASRock', 'B650M Pro RS', 139, 'AM5', 'DDR5', 'Micro-ATX', { chipset: 'B650', slotRam: 4, slotM2: 2, wifi: false, pcie5: false }),
  mobo('ASUS', 'TUF Gaming B650M-Plus WiFi', 189, 'AM5', 'DDR5', 'Micro-ATX', { chipset: 'B650', slotRam: 4, slotM2: 2, wifi: true, pcie5: false }),
  mobo('MSI', 'MPG X670E Carbon WiFi', 469, 'AM5', 'DDR5', 'ATX', { chipset: 'X670E', slotRam: 4, slotM2: 4, wifi: true, pcie5: true }),
  mobo('ASUS ROG', 'Crosshair X670E Hero', 679, 'AM5', 'DDR5', 'ATX', { chipset: 'X670E', slotRam: 4, slotM2: 4, wifi: true, pcie5: true }),
  mobo('Gigabyte', 'X670E Aorus Master', 499, 'AM5', 'DDR5', 'ATX', { chipset: 'X670E', slotRam: 4, slotM2: 4, wifi: true, pcie5: true, colore: 'Grigio' }),
  mobo('ASRock', 'B650I Lightning WiFi', 289, 'AM5', 'DDR5', 'Mini-ITX', { chipset: 'B650E', slotRam: 2, slotM2: 2, wifi: true, pcie5: true, colore: 'Bianco' }),
  mobo('MSI', 'MPG B650I Edge WiFi', 279, 'AM5', 'DDR5', 'Mini-ITX', { chipset: 'B650', slotRam: 2, slotM2: 2, wifi: true, pcie5: false }),
  mobo('MSI', 'MAG B550 Tomahawk', 159, 'AM4', 'DDR4', 'ATX', { chipset: 'B550', slotRam: 4, slotM2: 2, wifi: false, pcie5: false }),
  mobo('ASUS ROG', 'Strix B550-F Gaming', 179, 'AM4', 'DDR4', 'ATX', { chipset: 'B550', slotRam: 4, slotM2: 2, wifi: false, pcie5: false }),
  mobo('Gigabyte', 'B550I Aorus Pro AX', 199, 'AM4', 'DDR4', 'Mini-ITX', { chipset: 'B550', slotRam: 2, slotM2: 1, wifi: true, pcie5: false }),
  mobo('ASUS ROG', 'Strix Z790-E Gaming WiFi', 479, 'LGA1700', 'DDR5', 'ATX', { chipset: 'Z790', slotRam: 4, slotM2: 4, wifi: true, pcie5: true }),
  mobo('MSI', 'MAG Z790 Tomahawk WiFi', 299, 'LGA1700', 'DDR5', 'ATX', { chipset: 'Z790', slotRam: 4, slotM2: 4, wifi: true, pcie5: true }),
  mobo('Gigabyte', 'Z790 Aorus Elite AX', 269, 'LGA1700', 'DDR5', 'ATX', { chipset: 'Z790', slotRam: 4, slotM2: 3, wifi: true, pcie5: true }),
  mobo('ASUS', 'TUF Gaming B760M-Plus WiFi D4', 179, 'LGA1700', 'DDR4', 'Micro-ATX', { chipset: 'B760', slotRam: 4, slotM2: 2, wifi: true, pcie5: false }),
  mobo('MSI', 'PRO B760M-A DDR4', 119, 'LGA1700', 'DDR4', 'Micro-ATX', { chipset: 'B760', slotRam: 4, slotM2: 2, wifi: false, pcie5: false }),
  mobo('ASRock', 'Z790I Lightning WiFi', 329, 'LGA1700', 'DDR5', 'Mini-ITX', { chipset: 'Z790', slotRam: 2, slotM2: 2, wifi: true, pcie5: true, colore: 'Bianco' }),
  mobo('ASUS ROG', 'Strix Z890-E Gaming WiFi', 549, 'LGA1851', 'DDR5', 'ATX', { chipset: 'Z890', slotRam: 4, slotM2: 4, wifi: true, pcie5: true }),
  mobo('MSI', 'MAG Z890 Tomahawk WiFi', 329, 'LGA1851', 'DDR5', 'ATX', { chipset: 'Z890', slotRam: 4, slotM2: 4, wifi: true, pcie5: true }),
]

/* ------------------------------------------------------------------ CPU */

interface CpuOpt {
  core: number
  thread: number
  freq: number
  serie: string
  igpu: boolean
  oc: boolean
  anno: number
  coolerIncluso?: boolean
  ddr5?: boolean
}
function cpu(marca: 'AMD' | 'Intel', modello: string, prezzo: number, watt: number, socket: string, o: CpuOpt): Componente {
  const tag: string[] = [socket]
  if (o.ddr5 ?? true) tag.push('DDR5')
  if (o.oc) tag.push('Overclock')
  if (o.core >= 16) tag.push('Alte prestazioni')
  if (modello.includes('X3D')) tag.push('Gaming')
  return crea({
    categoria: 'cpu',
    marca,
    modello,
    nome: `${marca === 'AMD' ? 'AMD' : 'Intel'} ${modello}`,
    prezzo,
    wattaggio: watt,
    socket,
    anno: o.anno,
    descrizione: `Processore ${o.core} core e ${o.thread} thread fino a ${o.freq} GHz per socket ${socket}${o.igpu ? ', con grafica integrata' : ''}${o.coolerIncluso ? ' e dissipatore incluso' : ''}.`,
    tag,
    modello3D: `cpu/${marca.toLowerCase()}`,
    compatibilita: [socket],
    extra: { core: o.core, thread: o.thread, freq: o.freq, serie: o.serie, igpu: o.igpu, overclock: o.oc, pcie5: socket !== 'AM4' && socket !== 'LGA1700' ? true : socket === 'LGA1700', ddr5: o.ddr5 ?? true, coolerIncluso: o.coolerIncluso ?? false },
  })
}

const CPUS: Componente[] = [
  cpu('AMD', 'Ryzen 5 7600', 229, 88, 'AM5', { core: 6, thread: 12, freq: 5.1, serie: 'Ryzen 5', igpu: true, oc: false, anno: 2023, coolerIncluso: true }),
  cpu('AMD', 'Ryzen 5 7600X', 249, 142, 'AM5', { core: 6, thread: 12, freq: 5.3, serie: 'Ryzen 5', igpu: true, oc: true, anno: 2022 }),
  cpu('AMD', 'Ryzen 7 7700', 329, 88, 'AM5', { core: 8, thread: 16, freq: 5.3, serie: 'Ryzen 7', igpu: true, oc: false, anno: 2023, coolerIncluso: true }),
  cpu('AMD', 'Ryzen 7 7700X', 349, 142, 'AM5', { core: 8, thread: 16, freq: 5.4, serie: 'Ryzen 7', igpu: true, oc: true, anno: 2022 }),
  cpu('AMD', 'Ryzen 7 7800X3D', 399, 120, 'AM5', { core: 8, thread: 16, freq: 5.0, serie: 'Ryzen 7', igpu: true, oc: false, anno: 2023 }),
  cpu('AMD', 'Ryzen 7 9800X3D', 479, 120, 'AM5', { core: 8, thread: 16, freq: 5.2, serie: 'Ryzen 7', igpu: true, oc: true, anno: 2024 }),
  cpu('AMD', 'Ryzen 9 7900X', 429, 230, 'AM5', { core: 12, thread: 24, freq: 5.6, serie: 'Ryzen 9', igpu: true, oc: true, anno: 2022 }),
  cpu('AMD', 'Ryzen 9 9900X', 459, 162, 'AM5', { core: 12, thread: 24, freq: 5.6, serie: 'Ryzen 9', igpu: true, oc: true, anno: 2024 }),
  cpu('AMD', 'Ryzen 9 7950X', 549, 230, 'AM5', { core: 16, thread: 32, freq: 5.7, serie: 'Ryzen 9', igpu: true, oc: true, anno: 2022 }),
  cpu('AMD', 'Ryzen 9 7950X3D', 649, 160, 'AM5', { core: 16, thread: 32, freq: 5.7, serie: 'Ryzen 9', igpu: true, oc: true, anno: 2023 }),
  cpu('AMD', 'Ryzen 9 9950X', 599, 200, 'AM5', { core: 16, thread: 32, freq: 5.7, serie: 'Ryzen 9', igpu: true, oc: true, anno: 2024 }),
  cpu('AMD', 'Ryzen 5 5600', 119, 76, 'AM4', { core: 6, thread: 12, freq: 4.4, serie: 'Ryzen 5', igpu: false, oc: true, anno: 2022, coolerIncluso: true, ddr5: false }),
  cpu('AMD', 'Ryzen 7 5800X3D', 329, 142, 'AM4', { core: 8, thread: 16, freq: 4.5, serie: 'Ryzen 7', igpu: false, oc: false, anno: 2022, ddr5: false }),
  cpu('Intel', 'Core i5-12400F', 139, 117, 'LGA1700', { core: 6, thread: 12, freq: 4.4, serie: 'Core i5', igpu: false, oc: false, anno: 2022, coolerIncluso: true }),
  cpu('Intel', 'Core i5-13600K', 319, 181, 'LGA1700', { core: 14, thread: 20, freq: 5.1, serie: 'Core i5', igpu: true, oc: true, anno: 2022 }),
  cpu('Intel', 'Core i5-14600K', 345, 181, 'LGA1700', { core: 14, thread: 20, freq: 5.3, serie: 'Core i5', igpu: true, oc: true, anno: 2023 }),
  cpu('Intel', 'Core i7-14700K', 419, 253, 'LGA1700', { core: 20, thread: 28, freq: 5.6, serie: 'Core i7', igpu: true, oc: true, anno: 2023 }),
  cpu('Intel', 'Core i9-14900K', 549, 253, 'LGA1700', { core: 24, thread: 32, freq: 6.0, serie: 'Core i9', igpu: true, oc: true, anno: 2023 }),
  cpu('Intel', 'Core Ultra 5 245K', 309, 159, 'LGA1851', { core: 14, thread: 14, freq: 5.2, serie: 'Core Ultra 5', igpu: true, oc: true, anno: 2024 }),
  cpu('Intel', 'Core Ultra 7 265K', 409, 250, 'LGA1851', { core: 20, thread: 20, freq: 5.5, serie: 'Core Ultra 7', igpu: true, oc: true, anno: 2024 }),
  cpu('Intel', 'Core Ultra 9 285K', 629, 250, 'LGA1851', { core: 24, thread: 24, freq: 5.7, serie: 'Core Ultra 9', igpu: true, oc: true, anno: 2024 }),
]

/* ------------------------------------------------------------------ GPU */

interface GpuOpt {
  vram: number
  slot: number
  fans: 2 | 3
  conn: number
  serie: string
  colore?: string
  rgb?: boolean
  anno: number
  dlss?: boolean
}
function gpu(chip: 'NVIDIA' | 'AMD', partner: string, modello: string, prezzo: number, watt: number, lung: number, o: GpuOpt): Componente {
  const richiede12v = chip === 'NVIDIA' && watt >= 200
  const tag = [`${o.vram} GB`]
  if (o.colore === 'Bianco') tag.push('White Edition')
  if (watt >= 320) tag.push('Alte prestazioni')
  if (richiede12v) tag.push('12VHPWR')
  if (o.rgb) tag.push('RGB')
  if (chip === 'NVIDIA' && o.anno >= 2025) tag.push('PCIe 5.0')
  return crea({
    categoria: 'gpu',
    marca: chip,
    modello: `${partner} ${modello}`,
    nome: `${partner} ${modello}`,
    prezzo,
    wattaggio: watt,
    colore: o.colore ?? 'Nero',
    lunghezzaGpuMm: lung,
    connettoriPCIe: o.conn,
    anno: o.anno,
    descrizione: `Scheda video ${o.vram} GB con ${o.fans} ventole, lunga ${lung} mm e spessa ${o.slot} slot, ${richiede12v ? 'alimentata tramite connettore 12VHPWR' : 'con connettori PCIe tradizionali'}.`,
    tag,
    modello3D: `gpu/${o.fans}-ventole`,
    compatibilita: ['PCIe x16'],
    extra: { chip, partner, vram: o.vram, slot: o.slot, ventole: o.fans, serie: o.serie, richiede12vhpwr: richiede12v, rt: true, dlss: chip === 'NVIDIA', fsr: true, rgb: o.rgb ?? false, backplate: true },
  })
}

const GPUS: Componente[] = [
  gpu('NVIDIA', 'MSI Ventus 2X', 'GeForce RTX 4060', 299, 115, 199, { vram: 8, slot: 2, fans: 2, conn: 1, serie: 'RTX 40', anno: 2023 }),
  gpu('NVIDIA', 'ASUS Dual', 'GeForce RTX 4060 Ti', 419, 160, 227, { vram: 8, slot: 2, fans: 2, conn: 2, serie: 'RTX 40', anno: 2023 }),
  gpu('NVIDIA', 'Gigabyte Gaming OC', 'GeForce RTX 4070', 589, 200, 261, { vram: 12, slot: 2.5, fans: 3, conn: 2, serie: 'RTX 40', anno: 2023, rgb: true }),
  gpu('NVIDIA', 'ASUS Dual', 'GeForce RTX 4070 Super White', 629, 220, 267, { vram: 12, slot: 2.5, fans: 2, conn: 2, serie: 'RTX 40', anno: 2024, colore: 'Bianco' }),
  gpu('NVIDIA', 'MSI Gaming X Slim', 'GeForce RTX 4070 Ti Super', 849, 285, 307, { vram: 16, slot: 2.5, fans: 3, conn: 3, serie: 'RTX 40', anno: 2024, rgb: true }),
  gpu('NVIDIA', 'ASUS ROG Strix', 'GeForce RTX 4080 Super', 1199, 320, 357, { vram: 16, slot: 3.5, fans: 3, conn: 3, serie: 'RTX 40', anno: 2024, rgb: true }),
  gpu('NVIDIA', 'NVIDIA Founders Edition', 'GeForce RTX 4090', 1799, 450, 304, { vram: 24, slot: 3, fans: 2, conn: 4, serie: 'RTX 40', anno: 2022 }),
  gpu('NVIDIA', 'MSI Ventus 3X', 'GeForce RTX 5060 Ti 16GB', 459, 180, 280, { vram: 16, slot: 2.5, fans: 3, conn: 2, serie: 'RTX 50', anno: 2025 }),
  gpu('NVIDIA', 'Gigabyte Eagle OC', 'GeForce RTX 5070', 629, 250, 300, { vram: 12, slot: 2.5, fans: 3, conn: 2, serie: 'RTX 50', anno: 2025 }),
  gpu('NVIDIA', 'MSI Gaming Trio', 'GeForce RTX 5070 Ti', 899, 300, 338, { vram: 16, slot: 3, fans: 3, conn: 3, serie: 'RTX 50', anno: 2025, rgb: true }),
  gpu('NVIDIA', 'ASUS TUF Gaming', 'GeForce RTX 5080', 1249, 360, 348, { vram: 16, slot: 3.5, fans: 3, conn: 3, serie: 'RTX 50', anno: 2025, rgb: true }),
  gpu('NVIDIA', 'NVIDIA Founders Edition', 'GeForce RTX 5080', 1169, 360, 304, { vram: 16, slot: 2, fans: 2, conn: 3, serie: 'RTX 50', anno: 2025 }),
  gpu('NVIDIA', 'MSI Suprim', 'GeForce RTX 5090', 2399, 575, 358, { vram: 32, slot: 3.5, fans: 3, conn: 4, serie: 'RTX 50', anno: 2025, rgb: true }),
  gpu('NVIDIA', 'NVIDIA Founders Edition', 'GeForce RTX 5090', 2329, 575, 304, { vram: 32, slot: 2, fans: 2, conn: 4, serie: 'RTX 50', anno: 2025 }),
  gpu('AMD', 'Sapphire Pulse', 'Radeon RX 7600', 279, 165, 240, { vram: 8, slot: 2, fans: 2, conn: 1, serie: 'Radeon RX', anno: 2023 }),
  gpu('AMD', 'XFX Speedster', 'Radeon RX 7700 XT', 429, 245, 322, { vram: 12, slot: 2.5, fans: 3, conn: 2, serie: 'Radeon RX', anno: 2023 }),
  gpu('AMD', 'Sapphire Nitro+', 'Radeon RX 7800 XT', 549, 263, 320, { vram: 16, slot: 3, fans: 3, conn: 2, serie: 'Radeon RX', anno: 2023, rgb: true }),
  gpu('AMD', 'ASRock Challenger', 'Radeon RX 7900 GRE', 569, 260, 270, { vram: 16, slot: 2.5, fans: 3, conn: 2, serie: 'Radeon RX', anno: 2024 }),
  gpu('AMD', 'Sapphire Pulse', 'Radeon RX 7900 XT', 729, 315, 320, { vram: 20, slot: 3, fans: 3, conn: 3, serie: 'Radeon RX', anno: 2022 }),
  gpu('AMD', 'ASUS TUF Gaming', 'Radeon RX 7900 XTX', 999, 355, 350, { vram: 24, slot: 3.5, fans: 3, conn: 3, serie: 'Radeon RX', anno: 2022, rgb: true }),
  gpu('AMD', 'AMD Reference', 'Radeon RX 7900 XTX', 949, 355, 287, { vram: 24, slot: 2.5, fans: 2, conn: 3, serie: 'Radeon RX', anno: 2022 }),
  gpu('AMD', 'XFX Swift', 'Radeon RX 9070', 599, 220, 330, { vram: 16, slot: 2.5, fans: 3, conn: 2, serie: 'Radeon RX', anno: 2025 }),
  gpu('AMD', 'Sapphire Pure', 'Radeon RX 9070 XT White', 749, 304, 330, { vram: 16, slot: 3, fans: 3, conn: 3, serie: 'Radeon RX', anno: 2025, colore: 'Bianco', rgb: true }),
  gpu('AMD', 'Gigabyte Gaming OC', 'Radeon RX 9070 XT', 729, 304, 329, { vram: 16, slot: 3, fans: 3, conn: 3, serie: 'Radeon RX', anno: 2025, rgb: true }),
]

/* ------------------------------------------------------------------ RAM */

interface RamOpt {
  freq: number
  cl: number
  h: number
  rgb: boolean
  colore?: string
  moduli: 2 | 4
}
function ram(marca: string, modello: string, prezzo: number, tipo: 'DDR4' | 'DDR5', capGb: number, o: RamOpt): Componente {
  const config = `${o.moduli}x${capGb / o.moduli}GB`
  const tag = [tipo, `${o.freq}MHz`]
  if (o.rgb) tag.push('RGB')
  if (o.colore === 'Bianco') tag.push('White Edition')
  if (o.h <= 35) tag.push('Low Profile')
  return crea({
    categoria: 'ram',
    marca,
    modello: `${modello} ${tipo} ${o.freq} ${capGb}GB`,
    nome: `${marca} ${modello} ${tipo} ${o.freq}MHz ${capGb}GB`,
    prezzo,
    wattaggio: o.moduli * 5,
    colore: o.colore ?? 'Nero',
    tipoRam: tipo,
    capacita: `${capGb}GB`,
    descrizione: `Kit ${capGb} GB ${tipo} a ${o.freq} MHz (${config}), latenza CL${o.cl} e altezza di ${o.h} mm${o.rgb ? ', con illuminazione RGB' : ''}.`,
    tag,
    modello3D: `ram/${o.rgb ? 'rgb' : 'standard'}`,
    compatibilita: [tipo, o.freq >= 5200 ? 'XMP / EXPO' : 'XMP'],
    extra: { moduli: o.moduli, configurazione: config, frequenza: o.freq, latenza: o.cl, altezzaMm: o.h, rgb: o.rgb, dissipatore: true, xmp: true, expo: tipo === 'DDR5' },
  })
}

const RAMS: Componente[] = [
  ram('Corsair', 'Vengeance', 109, 'DDR5', 32, { freq: 6000, cl: 36, h: 35, rgb: false, moduli: 2 }),
  ram('Corsair', 'Vengeance RGB', 139, 'DDR5', 32, { freq: 6000, cl: 30, h: 44, rgb: true, moduli: 2 }),
  ram('Corsair', 'Vengeance', 115, 'DDR5', 32, { freq: 6000, cl: 36, h: 35, rgb: false, moduli: 2, colore: 'Bianco' }),
  ram('G.Skill', 'Trident Z5 RGB', 149, 'DDR5', 32, { freq: 6000, cl: 30, h: 44, rgb: true, moduli: 2 }),
  ram('G.Skill', 'Trident Z5 RGB', 159, 'DDR5', 32, { freq: 6000, cl: 30, h: 44, rgb: true, moduli: 2, colore: 'Bianco' }),
  ram('G.Skill', 'Trident Z5 Neo RGB', 159, 'DDR5', 32, { freq: 6000, cl: 30, h: 44, rgb: true, moduli: 2 }),
  ram('G.Skill', 'Ripjaws S5', 119, 'DDR5', 32, { freq: 6000, cl: 30, h: 34, rgb: false, moduli: 2 }),
  ram('G.Skill', 'Trident Z5 RGB', 299, 'DDR5', 64, { freq: 6400, cl: 32, h: 44, rgb: true, moduli: 2 }),
  ram('Kingston', 'Fury Beast', 69, 'DDR5', 16, { freq: 5200, cl: 40, h: 34, rgb: false, moduli: 2 }),
  ram('Kingston', 'Fury Beast', 119, 'DDR5', 32, { freq: 6000, cl: 36, h: 34, rgb: false, moduli: 2 }),
  ram('Kingston', 'Fury Beast', 125, 'DDR5', 32, { freq: 6000, cl: 36, h: 34, rgb: false, moduli: 2, colore: 'Bianco' }),
  ram('Kingston', 'Fury Renegade RGB', 169, 'DDR5', 32, { freq: 6400, cl: 32, h: 44, rgb: true, moduli: 2 }),
  ram('Crucial', 'Pro', 99, 'DDR5', 32, { freq: 5600, cl: 46, h: 34, rgb: false, moduli: 2 }),
  ram('Crucial', 'Pro', 219, 'DDR5', 64, { freq: 6000, cl: 36, h: 34, rgb: false, moduli: 2 }),
  ram('Corsair', 'Dominator Titanium RGB', 339, 'DDR5', 64, { freq: 6400, cl: 32, h: 56, rgb: true, moduli: 2 }),
  ram('Corsair', 'Vengeance', 349, 'DDR5', 96, { freq: 6400, cl: 32, h: 35, rgb: false, moduli: 2 }),
  ram('G.Skill', 'Trident Z5 RGB', 289, 'DDR5', 64, { freq: 6000, cl: 30, h: 44, rgb: true, moduli: 4 }),
  ram('Kingston', 'Fury Beast', 45, 'DDR4', 16, { freq: 3200, cl: 16, h: 34, rgb: false, moduli: 2 }),
  ram('Corsair', 'Vengeance LPX', 79, 'DDR4', 32, { freq: 3600, cl: 18, h: 31, rgb: false, moduli: 2 }),
  ram('G.Skill', 'Ripjaws V', 69, 'DDR4', 32, { freq: 3200, cl: 16, h: 42, rgb: false, moduli: 2 }),
  ram('Corsair', 'Vengeance RGB RS', 89, 'DDR4', 32, { freq: 3600, cl: 18, h: 36, rgb: true, moduli: 2 }),
]

/* --------------------------------------------------------- DISSIPATORI */

interface AirOpt {
  h: number
  tdp: number
  db: number
  fans: number
  ramClear: number
  colore?: string
}
function aria(marca: string, modello: string, prezzo: number, o: AirOpt): Componente {
  const tag = ['Aria']
  if (o.db <= 24) tag.push('Silenzioso')
  if (o.h <= 80) tag.push('Compact')
  if (o.tdp >= 250) tag.push('Alte prestazioni')
  if (o.colore === 'Bianco') tag.push('White Edition')
  return crea({
    categoria: 'dissipatore',
    marca,
    modello,
    prezzo,
    colore: o.colore ?? 'Argento',
    formato: 'Aria',
    altezzaDissipatoreMm: o.h,
    numeroVentole: o.fans,
    wattaggio: 3 * o.fans,
    descrizione: `Dissipatore ad aria alto ${o.h} mm con ${o.fans} ${o.fans > 1 ? 'ventole' : 'ventola'}, capace di dissipare fino a ${o.tdp} W con rumorosità di circa ${o.db} dB.`,
    tag,
    modello3D: o.h <= 80 ? 'dissipatore/low-profile' : o.fans > 1 ? 'dissipatore/dual-tower' : 'dissipatore/single-tower',
    compatibilita: TUTTI_SOCKET,
    extra: { tdpMax: o.tdp, rumore: o.db, margineRamMm: o.ramClear, rgb: false, pompa: false, display: false },
  })
}
interface AioOpt {
  size: 240 | 280 | 360
  tdp: number
  db: number
  rgb: boolean
  display?: boolean
  colore?: string
}
function aio(marca: string, modello: string, prezzo: number, o: AioOpt): Componente {
  const fans = o.size === 360 ? 3 : 2
  const tag = ['AIO', `${o.size}mm`]
  if (o.rgb) tag.push('RGB')
  if (o.display) tag.push('Display')
  if (o.colore === 'Bianco') tag.push('White Edition')
  if (o.tdp >= 300) tag.push('Alte prestazioni')
  return crea({
    categoria: 'dissipatore',
    marca,
    modello,
    prezzo,
    colore: o.colore ?? 'Nero',
    formato: 'AIO',
    formatoRadiatore: String(o.size),
    numeroVentole: fans,
    wattaggio: 12 + 2 * fans,
    descrizione: `Raffreddamento a liquido AIO da ${o.size} mm con ${fans} ventole${o.display ? ' e display sulla pompa' : ''}, gestisce fino a ${o.tdp} W.`,
    tag,
    modello3D: `dissipatore/aio-${o.size}`,
    compatibilita: TUTTI_SOCKET,
    extra: { tdpMax: o.tdp, rumore: o.db, margineRamMm: 999, rgb: o.rgb, pompa: true, display: o.display ?? false },
  })
}

const COOLERS: Componente[] = [
  aria('Noctua', 'NH-D15', 109, { h: 165, tdp: 250, db: 24, fans: 2, ramClear: 32, colore: 'Marrone' }),
  aria('Noctua', 'NH-D15 chromax.black', 129, { h: 165, tdp: 250, db: 24, fans: 2, ramClear: 32, colore: 'Nero' }),
  aria('Noctua', 'NH-U12A', 129, { h: 158, tdp: 220, db: 23, fans: 2, ramClear: 40, colore: 'Marrone' }),
  aria('Noctua', 'NH-L12S', 69, { h: 70, tdp: 90, db: 22, fans: 1, ramClear: 70 }),
  aria('Thermalright', 'Peerless Assassin 120 SE', 39, { h: 155, tdp: 260, db: 26, fans: 2, ramClear: 45 }),
  aria('be quiet!', 'Dark Rock Pro 5', 95, { h: 168, tdp: 270, db: 22, fans: 2, ramClear: 40, colore: 'Nero' }),
  aria('be quiet!', 'Pure Rock Pro 3', 49, { h: 155, tdp: 190, db: 25, fans: 1, ramClear: 45, colore: 'Nero' }),
  aria('Corsair', 'A115', 89, { h: 164, tdp: 270, db: 28, fans: 2, ramClear: 40, colore: 'Nero' }),
  aria('DeepCool', 'AK400', 29, { h: 155, tdp: 220, db: 28, fans: 1, ramClear: 60, colore: 'Nero' }),
  aio('Arctic', 'Liquid Freezer III 360', 105, { size: 360, tdp: 350, db: 28, rgb: false }),
  aio('Arctic', 'Liquid Freezer III 280', 95, { size: 280, tdp: 300, db: 27, rgb: false }),
  aio('Corsair', 'iCUE H150i Elite LCD XT', 249, { size: 360, tdp: 330, db: 30, rgb: true, display: true }),
  aio('Corsair', 'iCUE H100i Elite', 159, { size: 240, tdp: 250, db: 29, rgb: true }),
  aio('NZXT', 'Kraken Elite 360', 279, { size: 360, tdp: 330, db: 30, rgb: true, display: true }),
  aio('NZXT', 'Kraken Elite 240', 229, { size: 240, tdp: 250, db: 30, rgb: true, display: true }),
  aio('NZXT', 'Kraken 280', 169, { size: 280, tdp: 280, db: 28, rgb: true }),
  aio('Lian Li', 'Galahad II Trinity 360', 149, { size: 360, tdp: 330, db: 29, rgb: true, colore: 'Bianco' }),
  aio('Lian Li', 'Galahad II Trinity 240', 119, { size: 240, tdp: 250, db: 28, rgb: true }),
  aio('be quiet!', 'Silent Loop 3 360', 139, { size: 360, tdp: 320, db: 24, rgb: false }),
]

/* ------------------------------------------------------------------ SSD */

function ssd(marca: string, modello: string, prezzo: number, capGb: number, formato: 'M.2 NVMe' | 'SATA', iface: string, rd: number, wr: number, heat = false, colore = 'Nero'): Componente {
  const cap = capGb >= 1000 ? `${capGb / 1000}TB` : `${capGb}GB`
  const tag = [formato === 'SATA' ? 'SATA' : 'NVMe', iface, cap]
  if (iface === 'PCIe 5.0') tag.push('PCIe 5.0')
  if (heat) tag.push('Dissipatore')
  return crea({
    categoria: 'ssd',
    marca,
    modello: `${modello} ${cap}`,
    nome: `${marca} ${modello} ${cap}`,
    prezzo,
    wattaggio: formato === 'SATA' ? 3 : iface === 'PCIe 5.0' ? 10 : 7,
    colore,
    formato,
    capacita: cap,
    descrizione: `SSD ${formato} da ${cap} con interfaccia ${iface}, lettura fino a ${rd} MB/s e scrittura fino a ${wr} MB/s.`,
    tag,
    modello3D: formato === 'SATA' ? 'ssd/sata' : heat ? 'ssd/m2-dissipatore' : 'ssd/m2',
    compatibilita: [formato === 'SATA' ? 'SATA III' : 'M.2 2280'],
    extra: { interfaccia: iface, lettura: rd, scrittura: wr, dissipatore: heat, tipologia: capGb >= 2000 ? 'Workstation' : prezzo > 100 ? 'Creator' : 'Gaming', capGb },
  })
}

const SSDS: Componente[] = [
  ssd('Samsung', '990 Pro', 119, 1000, 'M.2 NVMe', 'PCIe 4.0', 7450, 6900),
  ssd('Samsung', '990 Pro', 199, 2000, 'M.2 NVMe', 'PCIe 4.0', 7450, 6900),
  ssd('Samsung', '990 Pro', 349, 4000, 'M.2 NVMe', 'PCIe 4.0', 7450, 6900),
  ssd('Samsung', '990 EVO Plus', 139, 2000, 'M.2 NVMe', 'PCIe 4.0', 7250, 6300),
  ssd('WD Black', 'SN850X', 89, 1000, 'M.2 NVMe', 'PCIe 4.0', 7300, 6300, true),
  ssd('WD Black', 'SN850X', 149, 2000, 'M.2 NVMe', 'PCIe 4.0', 7300, 6600, true),
  ssd('WD Black', 'SN850X', 299, 4000, 'M.2 NVMe', 'PCIe 4.0', 7300, 6600, true),
  ssd('Crucial', 'T500', 89, 1000, 'M.2 NVMe', 'PCIe 4.0', 7300, 6800),
  ssd('Crucial', 'T500', 159, 2000, 'M.2 NVMe', 'PCIe 4.0', 7400, 7000),
  ssd('Crucial', 'T705', 299, 2000, 'M.2 NVMe', 'PCIe 5.0', 14500, 12700, true),
  ssd('Crucial', 'P3 Plus', 69, 1000, 'M.2 NVMe', 'PCIe 4.0', 5000, 3600),
  ssd('Kingston', 'KC3000', 149, 2000, 'M.2 NVMe', 'PCIe 4.0', 7000, 7000),
  ssd('Kingston', 'NV3', 59, 1000, 'M.2 NVMe', 'PCIe 4.0', 6000, 4000),
  ssd('Corsair', 'MP700 Pro', 329, 2000, 'M.2 NVMe', 'PCIe 5.0', 12400, 11800, true),
  ssd('Samsung', '870 EVO', 89, 1000, 'SATA', 'SATA III', 560, 530),
  ssd('Samsung', '870 EVO', 149, 2000, 'SATA', 'SATA III', 560, 530),
  ssd('Crucial', 'MX500', 79, 1000, 'SATA', 'SATA III', 560, 510),
  ssd('WD Blue', 'SA510', 45, 500, 'SATA', 'SATA III', 560, 520),
]

/* ------------------------------------------------------------ ALIMENTATORI */

interface PsuOpt {
  cert: string
  formato: 'ATX' | 'SFX'
  mod: 'Non modulare' | 'Semi-modulare' | 'Full modular'
  pcie: number
  nativo: boolean
  colore?: string
  zero?: boolean
  sleeved?: boolean
}
function psu(marca: string, modello: string, prezzo: number, watt: number, o: PsuOpt): Componente {
  const tag = [o.cert.replace('80 Plus ', ''), o.formato]
  if (o.mod === 'Full modular') tag.push('Full Modular')
  if (o.formato === 'SFX') tag.push('SFX')
  if (o.nativo) tag.push('12VHPWR')
  if (o.colore === 'Bianco') tag.push('White Edition')
  return crea({
    categoria: 'alimentatore',
    marca,
    modello: `${modello} ${watt}W`,
    nome: `${marca} ${modello} ${watt}W`,
    prezzo,
    wattaggio: watt,
    colore: o.colore ?? 'Nero',
    formato: o.formato,
    connettoriPCIe: o.pcie,
    certificazione: o.cert,
    descrizione: `Alimentatore ${o.formato} da ${watt} W certificato ${o.cert}, ${o.mod.toLowerCase()}, con ${o.pcie} connettori PCIe${o.nativo ? ' e cavo 12VHPWR nativo' : ''}.`,
    tag,
    modello3D: `alimentatore/${o.formato.toLowerCase()}`,
    compatibilita: [o.formato],
    extra: { modularita: o.mod, nativo12vhpwr: o.nativo, zeroRpm: o.zero ?? false, sleeved: o.sleeved ?? false, protezioniAvanzate: prezzo > 90 },
  })
}

const PSUS: Componente[] = [
  psu('Corsair', 'RM850x', 159, 850, { cert: '80 Plus Gold', formato: 'ATX', mod: 'Full modular', pcie: 6, nativo: false, zero: true }),
  psu('Corsair', 'RM750e', 109, 750, { cert: '80 Plus Gold', formato: 'ATX', mod: 'Full modular', pcie: 4, nativo: true, zero: true }),
  psu('Corsair', 'RM1000x', 189, 1000, { cert: '80 Plus Gold', formato: 'ATX', mod: 'Full modular', pcie: 6, nativo: true, zero: true }),
  psu('Corsair', 'HX1200', 249, 1200, { cert: '80 Plus Platinum', formato: 'ATX', mod: 'Full modular', pcie: 8, nativo: true, zero: true }),
  psu('Corsair', 'SF750', 169, 750, { cert: '80 Plus Platinum', formato: 'SFX', mod: 'Full modular', pcie: 4, nativo: false, zero: true }),
  psu('be quiet!', 'Dark Power 13', 269, 1000, { cert: '80 Plus Titanium', formato: 'ATX', mod: 'Full modular', pcie: 6, nativo: true, zero: true }),
  psu('be quiet!', 'Straight Power 12', 189, 850, { cert: '80 Plus Platinum', formato: 'ATX', mod: 'Full modular', pcie: 6, nativo: true, zero: true }),
  psu('be quiet!', 'Pure Power 12 M', 109, 750, { cert: '80 Plus Gold', formato: 'ATX', mod: 'Full modular', pcie: 4, nativo: true }),
  psu('Seasonic', 'Vertex GX', 219, 1000, { cert: '80 Plus Gold', formato: 'ATX', mod: 'Full modular', pcie: 6, nativo: true, zero: true }),
  psu('Seasonic', 'Focus GX', 149, 850, { cert: '80 Plus Gold', formato: 'ATX', mod: 'Full modular', pcie: 6, nativo: false, zero: true }),
  psu('Seasonic', 'Prime TX', 399, 1300, { cert: '80 Plus Titanium', formato: 'ATX', mod: 'Full modular', pcie: 8, nativo: true, zero: true }),
  psu('Seasonic', 'Core GC', 89, 650, { cert: '80 Plus Gold', formato: 'ATX', mod: 'Semi-modulare', pcie: 2, nativo: false }),
  psu('MSI', 'MPG A1000G PCIE5', 189, 1000, { cert: '80 Plus Gold', formato: 'ATX', mod: 'Full modular', pcie: 6, nativo: true }),
  psu('Gigabyte', 'UD850GM PG5', 119, 850, { cert: '80 Plus Gold', formato: 'ATX', mod: 'Full modular', pcie: 4, nativo: true, colore: 'Nero' }),
  psu('Cooler Master', 'V850 SFX Gold', 179, 850, { cert: '80 Plus Gold', formato: 'SFX', mod: 'Full modular', pcie: 4, nativo: true }),
  psu('Cooler Master', 'MWE Bronze 550', 59, 550, { cert: '80 Plus Bronze', formato: 'ATX', mod: 'Non modulare', pcie: 2, nativo: false }),
  psu('Corsair', 'CX650', 69, 650, { cert: '80 Plus Bronze', formato: 'ATX', mod: 'Non modulare', pcie: 2, nativo: false }),
]

/* --------------------------------------------------------------- VENTOLE */

interface FanOpt {
  count: number
  size: 120 | 140
  tipo: 'Aria' | 'RGB' | 'ARGB'
  cfm: number
  db: number
  colore?: string
  hub?: boolean
}
function ventola(marca: string, modello: string, prezzo: number, o: FanOpt): Componente {
  const tag = [`${o.size}mm`, o.tipo]
  if (o.tipo !== 'Aria') tag.push('RGB')
  if (o.db <= 22) tag.push('Silenzioso')
  if (o.cfm >= 70) tag.push('High Airflow')
  if (o.colore === 'Bianco') tag.push('White Edition')
  return crea({
    categoria: 'ventole',
    marca,
    modello,
    prezzo,
    colore: o.colore ?? 'Nero',
    numeroVentole: o.count,
    wattaggio: o.count * 3,
    descrizione: `Set da ${o.count} ${o.count > 1 ? 'ventole' : 'ventola'} da ${o.size} mm (${o.tipo}) con flusso fino a ${o.cfm} CFM e rumorosità di ${o.db} dB.`,
    tag,
    modello3D: `ventole/${o.tipo.toLowerCase()}`,
    compatibilita: [`${o.size}mm`],
    extra: { dimensione: o.size, tipo: o.tipo, rgb: o.tipo !== 'Aria', flusso: o.cfm, rumore: o.db, hub: o.hub ?? o.tipo !== 'Aria', pwm: true, reverse: modello.includes('Reverse') || modello.includes('SL-Infinity') },
  })
}

const FANS: Componente[] = [
  ventola('Lian Li', 'UNI FAN SL-Infinity 120 (3 pezzi)', 109, { count: 3, size: 120, tipo: 'ARGB', cfm: 61, db: 29 }),
  ventola('Lian Li', 'UNI FAN SL-Infinity 120 (3 pezzi)', 112, { count: 3, size: 120, tipo: 'ARGB', cfm: 61, db: 29, colore: 'Bianco' }),
  ventola('Lian Li', 'UNI FAN TL 120 (3 pezzi)', 99, { count: 3, size: 120, tipo: 'ARGB', cfm: 64, db: 28 }),
  ventola('Corsair', 'iCUE SP120 RGB Elite (3 pezzi)', 69, { count: 3, size: 120, tipo: 'RGB', cfm: 47, db: 26 }),
  ventola('Corsair', 'iCUE LINK QX120 RGB (3 pezzi)', 149, { count: 3, size: 120, tipo: 'RGB', cfm: 75, db: 26 }),
  ventola('Corsair', 'iCUE SP120 RGB Elite (3 pezzi)', 72, { count: 3, size: 120, tipo: 'RGB', cfm: 47, db: 26, colore: 'Bianco' }),
  ventola('NZXT', 'F120 RGB Core (3 pezzi)', 59, { count: 3, size: 120, tipo: 'RGB', cfm: 50, db: 22 }),
  ventola('NZXT', 'F140 RGB Core (2 pezzi)', 55, { count: 2, size: 140, tipo: 'RGB', cfm: 68, db: 24 }),
  ventola('Noctua', 'NF-A12x25 PWM', 35, { count: 1, size: 120, tipo: 'Aria', cfm: 60, db: 22, colore: 'Marrone' }),
  ventola('Noctua', 'NF-A14 PWM', 30, { count: 1, size: 140, tipo: 'Aria', cfm: 82, db: 24, colore: 'Marrone' }),
  ventola('be quiet!', 'Silent Wings Pro 4 120', 29, { count: 1, size: 120, tipo: 'Aria', cfm: 54, db: 12 }),
  ventola('be quiet!', 'Light Wings 120 (3 pezzi)', 59, { count: 3, size: 120, tipo: 'ARGB', cfm: 60, db: 24 }),
  ventola('Arctic', 'P12 PWM PST (5 pezzi)', 29, { count: 5, size: 120, tipo: 'Aria', cfm: 56, db: 23, colore: 'Grigio' }),
  ventola('Arctic', 'P14 PWM PST (5 pezzi)', 34, { count: 5, size: 140, tipo: 'Aria', cfm: 72, db: 22, colore: 'Grigio' }),
  ventola('Thermalright', 'TL-C12C (3 pezzi)', 29, { count: 3, size: 120, tipo: 'Aria', cfm: 66, db: 25, colore: 'Grigio' }),
  ventola('Phanteks', 'T30-120 (3 pezzi)', 75, { count: 3, size: 120, tipo: 'ARGB', cfm: 80, db: 30 }),
]

/* ------------------------------------------------------- CAVI E ACCESSORI */

interface CavoOpt {
  tipo: 'Cavo GPU' | 'Cavo CPU' | 'Cavo alimentazione' | 'Extension' | 'Sleeved cable' | 'Adattatore' | 'Supporto GPU' | 'Hub RGB'
  lung: number
  colore: string
  hex?: string
  hvpwr?: boolean
  sleeving?: boolean
  hubRgb?: boolean
}
function cavo(marca: string, modello: string, prezzo: number, o: CavoOpt, desc: string): Componente {
  const tag: string[] = [o.tipo]
  if (o.sleeving) tag.push('Sleeved')
  if (o.hvpwr) tag.push('12VHPWR')
  if (o.colore === 'Bianco') tag.push('White Edition')
  return crea({
    categoria: 'cavi',
    marca,
    modello,
    prezzo,
    wattaggio: o.hubRgb ? 2 : 0,
    colore: o.colore,
    descrizione: desc,
    tag,
    modello3D: `cavi/${o.tipo.toLowerCase().replace(/\s/g, '-')}`,
    compatibilita: o.hvpwr ? ['12VHPWR'] : [],
    extra: { tipo: o.tipo, lunghezza: o.lung, sleeving: o.sleeving ?? false, hvpwr: o.hvpwr ?? false, hubRgb: o.hubRgb ?? false, supportoGpu: o.tipo === 'Supporto GPU', hex: o.hex ?? '' },
  })
}

const CAVI: Componente[] = [
  cavo('Corsair', 'Kit cavi sleeved Type 5 Gen 5 Nero', 119, { tipo: 'Sleeved cable', lung: 650, colore: 'Nero', hex: '#17171b', sleeving: true, hvpwr: true }, 'Kit completo di cavi intrecciati per alimentatori compatibili: ordine visivo e routing pulito dietro la scheda madre.'),
  cavo('Corsair', 'Kit cavi sleeved Type 5 Gen 5 Bianco', 119, { tipo: 'Sleeved cable', lung: 650, colore: 'Bianco', hex: '#f1f1f4', sleeving: true, hvpwr: true }, 'Kit di cavi intrecciati bianchi, ideale per build total white con alimentatori Corsair.'),
  cavo('CableMod', 'Kit cavi ModMesh Rosso', 129, { tipo: 'Sleeved cable', lung: 700, colore: 'Rosso', hex: '#d3202a', sleeving: true, hvpwr: true }, 'Cavi con calza ModMesh rossa per un contrasto netto con case e componenti scuri.'),
  cavo('Corsair', 'Cavo 12VHPWR 600W PCIe 5.0', 45, { tipo: 'Cavo GPU', lung: 650, colore: 'Nero', hex: '#17171b', hvpwr: true }, 'Cavo nativo 12VHPWR da 600 W per GPU di ultima generazione, con terminazione a 90 gradi.'),
  cavo('Corsair', 'Adattatore 12VHPWR 3x PCIe 8 pin', 25, { tipo: 'Adattatore', lung: 300, colore: 'Nero', hex: '#17171b', hvpwr: true }, 'Adattatore che collega tre connettori PCIe a 8 pin alla presa 12VHPWR di una GPU moderna.'),
  cavo('Lian Li', 'Kit GPU verticale PCIe 4.0', 59, { tipo: 'Extension', lung: 220, colore: 'Nero', hex: '#17171b' }, 'Riser PCIe 4.0 con staffa per montare la GPU in verticale nei case compatibili.'),
  cavo('Lian Li', 'Strimer Plus V2 24 pin', 79, { tipo: 'Extension', lung: 350, colore: 'Nero', hex: '#17171b', sleeving: true, hubRgb: true }, 'Estensione RGB con 120 LED indirizzabili per il connettore a 24 pin.'),
  cavo('NZXT', 'Controller RGB Hue 2', 49, { tipo: 'Hub RGB', lung: 0, colore: 'Nero', hubRgb: true }, 'Hub per collegare ventole e strisce LED RGB e controllarli con un unico profilo.'),
  cavo('be quiet!', 'Staffa anti-flessione GPU', 15, { tipo: 'Supporto GPU', lung: 0, colore: 'Nero' }, 'Staffa regolabile che sostiene le schede video pesanti ed evita la flessione del PCB.'),
  cavo('Corsair', 'Estensione 24 pin sleeved Bianco', 29, { tipo: 'Extension', lung: 300, colore: 'Bianco', hex: '#f1f1f4', sleeving: true }, 'Prolunga intrecciata per il connettore ATX a 24 pin, con pettini per allineare i fili.'),
  cavo('Corsair', 'Cavo CPU 8 pin sleeved Nero', 22, { tipo: 'Cavo CPU', lung: 650, colore: 'Nero', hex: '#17171b', sleeving: true }, 'Cavo EPS 8 pin con calza intrecciata, utile per CPU ad alto consumo e routing ordinato.'),
]

/* ------------------------------------------------------------- ASSEMBLAGGIO */

const TUTTI: Componente[] = [...CASES, ...MOBO, ...CPUS, ...GPUS, ...RAMS, ...COOLERS, ...SSDS, ...PSUS, ...FANS, ...CAVI]

// Assegna la fascia di prodotto in base ai quartili di prezzo di ciascuna categoria
const FASCE: Fascia[] = ['Entry Level', 'Mid Range', 'High End', 'Enthusiast']
for (const cat of new Set(TUTTI.map((c) => c.categoria))) {
  const lista = TUTTI.filter((c) => c.categoria === cat).sort((a, b) => a.prezzo - b.prezzo)
  lista.forEach((c, i) => {
    c.fascia = FASCE[Math.min(3, Math.floor((i / lista.length) * 4))]
  })
}
// Badge derivati da fascia e popolarità
for (const c of TUTTI) {
  if (c.fascia === 'Enthusiast' && !c.tag.includes('Premium')) c.tag.push('Premium')
  if (c.popolarita >= 88 && !c.tag.includes('Consigliato')) c.tag.push('Consigliato')
  if (c.fascia === 'Mid Range' && c.popolarita >= 75 && !c.tag.includes('Best Value')) c.tag.push('Best Value')
}

export const HARDWARE: Componente[] = TUTTI
export const HARDWARE_PER_ID: Record<string, Componente> = Object.fromEntries(TUTTI.map((c) => [c.id, c]))
export const per = (cat: Categoria) => TUTTI.filter((c) => c.categoria === cat)

export function trova(id: string | undefined | null): Componente | undefined {
  return id ? HARDWARE_PER_ID[id] : undefined
}

/** Lettura tipizzata dei campi "extra". */
export const ex = {
  n: (c: Componente | undefined, k: string, def = 0): number => {
    const v = c?.extra[k]
    return typeof v === 'number' ? v : def
  },
  s: (c: Componente | undefined, k: string, def = ''): string => {
    const v = c?.extra[k]
    return typeof v === 'string' ? v : def
  },
  b: (c: Componente | undefined, k: string, def = false): boolean => {
    const v = c?.extra[k]
    return typeof v === 'boolean' ? v : def
  },
}

export type { Extra }
