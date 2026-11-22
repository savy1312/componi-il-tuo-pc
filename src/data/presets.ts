import { HARDWARE } from './hardware'
import type { Categoria, ImpostazioniRgb, Selezione } from '../types'
import { RGB_DEFAULT } from './palettes'

export interface Preset {
  id: string
  nome: string
  descrizione: string
  uso: string
  sel: Selezione
  rgb: ImpostazioniRgb
  gpuVerticale?: boolean
}

function T(cat: Categoria, nome: string, colore?: string): string {
  const c = HARDWARE.find((x) => x.categoria === cat && x.nome === nome && (!colore || x.colore === colore))
  if (!c) throw new Error(`Preset: componente non trovato (${cat}: ${nome} ${colore ?? ''})`)
  return c.id
}

interface Def {
  id: string
  nome: string
  uso: string
  descrizione: string
  case: [string, string?]
  mobo: string
  cpu: string
  gpu?: string
  ram: [string, string?]
  cool?: string
  psu: string
  ssd: string[]
  fans?: [string, string?][]
  cavi?: string[]
  rgb: Partial<ImpostazioniRgb>
  gpuVerticale?: boolean
}

function costruisci(d: Def): Preset {
  return {
    id: d.id,
    nome: d.nome,
    uso: d.uso,
    descrizione: d.descrizione,
    gpuVerticale: d.gpuVerticale,
    sel: {
      case: T('case', d.case[0], d.case[1]),
      'scheda-madre': T('scheda-madre', d.mobo),
      cpu: T('cpu', d.cpu),
      gpu: d.gpu ? T('gpu', d.gpu) : undefined,
      ram: T('ram', d.ram[0], d.ram[1]),
      dissipatore: d.cool ? T('dissipatore', d.cool) : undefined,
      alimentatore: T('alimentatore', d.psu),
      ssd: d.ssd.map((n) => T('ssd', n)),
      ventole: (d.fans ?? []).map(([n, c]) => T('ventole', n, c)),
      cavi: (d.cavi ?? []).map((n) => T('cavi', n)),
    },
    rgb: { ...RGB_DEFAULT, ...d.rgb, bersagli: { ...RGB_DEFAULT.bersagli, ...(d.rgb.bersagli ?? {}) } },
  }
}

const SL = 'Lian Li UNI FAN SL-Infinity 120 (3 pezzi)'

export const PRESET: Preset[] = [
  costruisci({ id: 'gaming-4k-ultra', nome: 'Gaming 4K Ultra', uso: 'Gaming 4K', descrizione: 'Ryzen 7 7800X3D e RTX 5080 con AIO 360 mm e alimentatore da 1000 W: frame rate altissimi in 4K in un case a doppia camera.', case: ['Lian Li O11 Dynamic EVO', 'Nero'], mobo: 'ASUS ROG Strix B650E-F Gaming WiFi', cpu: 'AMD Ryzen 7 7800X3D', gpu: 'ASUS TUF Gaming GeForce RTX 5080', ram: ['G.Skill Trident Z5 RGB DDR5 6000MHz 32GB', 'Nero'], cool: 'Corsair iCUE H150i Elite LCD XT', psu: 'Corsair RM1000x 1000W', ssd: ['Samsung 990 Pro 2TB'], fans: [[SL, 'Nero']], rgb: { palette: 'ciano', effetto: 'onda' } }),
  costruisci({ id: 'gaming-1440p', nome: 'Gaming 1440p Competitivo', uso: 'Gaming 1440p', descrizione: 'Equilibrio ideale tra prezzo e prestazioni: Ryzen 5 7600 e RTX 5070 in un case con ottimo airflow.', case: ['Corsair 4000D Airflow', 'Nero'], mobo: 'MSI MAG B650 Tomahawk WiFi', cpu: 'AMD Ryzen 5 7600', gpu: 'Gigabyte Eagle OC GeForce RTX 5070', ram: ['Corsair Vengeance DDR5 6000MHz 32GB', 'Nero'], cool: 'Thermalright Peerless Assassin 120 SE', psu: 'Corsair RM750e 750W', ssd: ['WD Black SN850X 1TB'], fans: [['NZXT F120 RGB Core (3 pezzi)']], rgb: { palette: 'blu', effetto: 'respiro' } }),
  costruisci({ id: 'workstation-3d', nome: 'Workstation Rendering 3D', uso: 'Rendering', descrizione: 'Ryzen 9 7950X con 64 GB di RAM, RTX 5090 e 6 TB di SSD: pensata per rendering, simulazioni e scene complesse.', case: ['Fractal Design Torrent'], mobo: 'ASUS ROG Crosshair X670E Hero', cpu: 'AMD Ryzen 9 7950X', gpu: 'MSI Suprim GeForce RTX 5090', ram: ['G.Skill Trident Z5 RGB DDR5 6400MHz 64GB'], cool: 'Arctic Liquid Freezer III 360', psu: 'Seasonic Prime TX 1300W', ssd: ['Samsung 990 Pro 4TB', 'Crucial T500 2TB'], rgb: { palette: 'viola', effetto: 'aurora', intensita: 0.6 } }),
  costruisci({ id: 'creator-streaming', nome: 'Creator Video e Streaming', uso: 'Creazione contenuti', descrizione: 'Core i7-14700K e RTX 4070 Ti Super: montaggio 4K, encoding hardware e streaming fluido senza compromessi.', case: ['NZXT H7 Flow', 'Nero'], mobo: 'Gigabyte Z790 Aorus Elite AX', cpu: 'Intel Core i7-14700K', gpu: 'MSI Gaming X Slim GeForce RTX 4070 Ti Super', ram: ['Kingston Fury Renegade RGB DDR5 6400MHz 32GB'], cool: 'NZXT Kraken 280', psu: 'be quiet! Straight Power 12 850W', ssd: ['Samsung 990 Pro 2TB', 'Samsung 870 EVO 2TB'], fans: [['NZXT F120 RGB Core (3 pezzi)']], rgb: { palette: 'rosa', effetto: 'onda' } }),
  costruisci({ id: 'minimal-total-white', nome: 'Minimal Total White', uso: 'Estetica', descrizione: 'Build bianca dal design pulito: case, AIO, ventole, RAM e GPU in tinta con illuminazione sobria.', case: ['NZXT H7 Flow', 'Bianco'], mobo: 'ASRock B650I Lightning WiFi', cpu: 'AMD Ryzen 7 7700', gpu: 'ASUS Dual GeForce RTX 4070 Super White', ram: ['Corsair Vengeance DDR5 6000MHz 32GB', 'Bianco'], cool: 'Lian Li Galahad II Trinity 360', psu: 'Corsair RM750e 750W', ssd: ['Crucial T500 2TB'], fans: [[SL, 'Bianco']], cavi: ['Corsair Kit cavi sleeved Type 5 Gen 5 Bianco'], rgb: { palette: 'bianco', effetto: 'respiro', intensita: 0.55 } }),
  costruisci({ id: 'esport', nome: 'Esport Competitivo', uso: 'Esport', descrizione: 'Ryzen 7 7800X3D, RAM veloce e 7 ventole: latenze minime e temperature basse per sessioni lunghe.', case: ['Lian Li Lancool 216'], mobo: 'Gigabyte B650 Aorus Elite AX', cpu: 'AMD Ryzen 7 7800X3D', gpu: 'Gigabyte Eagle OC GeForce RTX 5070', ram: ['Kingston Fury Beast DDR5 6000MHz 32GB', 'Nero'], cool: 'Noctua NH-U12A', psu: 'Corsair RM750e 750W', ssd: ['Crucial T500 1TB'], fans: [['Arctic P12 PWM PST (5 pezzi)']], rgb: { palette: 'rosso', effetto: 'polso', intensita: 0.7 } }),
  costruisci({ id: 'silent', nome: 'Silent Build', uso: 'Silenziosità', descrizione: 'Case minimale, dissipatore a doppia torre e ventole Noctua: potenza costante con rumorosità ai minimi.', case: ['Fractal Design North', 'Nero'], mobo: 'Gigabyte B650 Aorus Elite AX', cpu: 'AMD Ryzen 5 7600', gpu: 'MSI Ventus 3X GeForce RTX 5060 Ti 16GB', ram: ['Corsair Vengeance DDR5 6000MHz 32GB', 'Nero'], cool: 'be quiet! Dark Rock Pro 5', psu: 'be quiet! Pure Power 12 M 750W', ssd: ['WD Black SN850X 1TB'], fans: [['Noctua NF-A14 PWM'], ['Noctua NF-A12x25 PWM']], rgb: { attivo: false } }),
  costruisci({ id: 'budget', nome: 'Budget Gaming', uso: 'Gaming economico', descrizione: 'Il minimo indispensabile per giocare in Full HD: Ryzen 5 7600 e RTX 4060 con una base solida e aggiornabile.', case: ['Corsair 4000D Airflow', 'Nero'], mobo: 'ASRock B650M Pro RS', cpu: 'AMD Ryzen 5 7600', gpu: 'MSI Ventus 2X GeForce RTX 4060', ram: ['Kingston Fury Beast DDR5 5200MHz 16GB', 'Nero'], cool: 'DeepCool AK400', psu: 'Corsair CX650 650W', ssd: ['Crucial P3 Plus 1TB'], fans: [['Thermalright TL-C12C (3 pezzi)']], rgb: { attivo: false } }),
  costruisci({ id: 'enthusiast-rgb', nome: 'Enthusiast RGB', uso: 'Massima potenza', descrizione: 'Ryzen 9 9950X, RTX 5090 e illuminazione ARGB ovunque: la build scenografica per chi vuole il massimo.', case: ['Lian Li O11 Dynamic EVO', 'Nero'], mobo: 'MSI MPG X670E Carbon WiFi', cpu: 'AMD Ryzen 9 9950X', gpu: 'MSI Suprim GeForce RTX 5090', ram: ['Corsair Dominator Titanium RGB DDR5 6400MHz 64GB'], cool: 'NZXT Kraken Elite 360', psu: 'Corsair HX1200 1200W', ssd: ['Corsair MP700 Pro 2TB', 'Samsung 990 Pro 2TB'], fans: [['Corsair iCUE LINK QX120 RGB (3 pezzi)']], cavi: ['Lian Li Strimer Plus V2 24 pin'], rgb: { palette: 'arcobaleno', effetto: 'arcobaleno', intensita: 1, velocita: 0.6 } }),
  costruisci({ id: 'sff', nome: 'Small Form Factor', uso: 'Compatto', descrizione: 'RTX 5080 Founders Edition, alimentatore SFX e AIO da 240 mm in un case da meno di 20 litri.', case: ['Cooler Master NR200P', 'Bianco'], mobo: 'ASRock B650I Lightning WiFi', cpu: 'AMD Ryzen 7 7700', gpu: 'NVIDIA Founders Edition GeForce RTX 5080', ram: ['Corsair Vengeance DDR5 6000MHz 32GB', 'Bianco'], cool: 'Lian Li Galahad II Trinity 240', psu: 'Cooler Master V850 SFX Gold 850W', ssd: ['Crucial T500 2TB'], rgb: { palette: 'ghiaccio', effetto: 'respiro', intensita: 0.6 } }),
  costruisci({ id: 'ai-workstation', nome: 'AI Workstation', uso: 'Intelligenza artificiale', descrizione: 'Core Ultra 9 285K, RTX 5090 con 32 GB di VRAM e 96 GB di RAM: addestramento e inferenza di modelli locali.', case: ['Fractal Design Torrent'], mobo: 'ASUS ROG Strix Z890-E Gaming WiFi', cpu: 'Intel Core Ultra 9 285K', gpu: 'NVIDIA Founders Edition GeForce RTX 5090', ram: ['Corsair Vengeance DDR5 6400MHz 96GB', 'Nero'], cool: 'Arctic Liquid Freezer III 360', psu: 'Seasonic Prime TX 1300W', ssd: ['Samsung 990 Pro 4TB', 'WD Black SN850X 4TB'], rgb: { palette: 'toxic', effetto: 'statico', intensita: 0.5 } }),
  costruisci({ id: 'home-office', nome: 'Home Office Premium', uso: 'Lavoro', descrizione: 'Ryzen 7 7700 con grafica integrata, SSD veloce e raffreddamento silenzioso: efficiente e compatto per la scrivania.', case: ['Fractal Design North', 'Bianco'], mobo: 'Gigabyte B650 Aorus Elite AX', cpu: 'AMD Ryzen 7 7700', ram: ['Kingston Fury Beast DDR5 6000MHz 32GB', 'Bianco'], cool: 'Noctua NH-U12A', psu: 'Seasonic Core GC 650W', ssd: ['Samsung 990 EVO Plus 2TB'], fans: [['Noctua NF-A14 PWM']], rgb: { attivo: false } }),
  costruisci({ id: 'content-creation', nome: 'Content Creation', uso: 'Grafica e video', descrizione: 'Core i9-14900K, RTX 4080 Super e 64 GB di RAM per Photoshop, DaVinci Resolve e Blender senza attese.', case: ['Lian Li Lancool 216'], mobo: 'MSI MAG Z790 Tomahawk WiFi', cpu: 'Intel Core i9-14900K', gpu: 'ASUS ROG Strix GeForce RTX 4080 Super', ram: ['G.Skill Trident Z5 RGB DDR5 6400MHz 64GB'], cool: 'NZXT Kraken Elite 360', psu: 'Corsair RM1000x 1000W', ssd: ['Samsung 990 Pro 2TB', 'Crucial T500 2TB'], rgb: { palette: 'sunset', effetto: 'aurora' } }),
  costruisci({ id: 'streaming', nome: 'Streaming Setup', uso: 'Live streaming', descrizione: 'Ryzen 7 7700X e RTX 4070 Super bianca: gioca e trasmette in contemporanea con un look pulito.', case: ['Corsair 4000D Airflow', 'Bianco'], mobo: 'MSI MAG B650 Tomahawk WiFi', cpu: 'AMD Ryzen 7 7700X', gpu: 'ASUS Dual GeForce RTX 4070 Super White', ram: ['Corsair Vengeance DDR5 6000MHz 32GB', 'Bianco'], cool: 'Corsair iCUE H100i Elite', psu: 'Corsair RM750e 750W', ssd: ['WD Black SN850X 2TB'], fans: [['Corsair iCUE SP120 RGB Elite (3 pezzi)', 'Bianco']], rgb: { palette: 'viola', effetto: 'onda' } }),
  costruisci({ id: 'vr-ready', nome: 'VR Ready', uso: 'Realtà virtuale', descrizione: 'RTX 5070 Ti e Ryzen 7 7800X3D: la potenza costante che serve ai visori VR ad alta risoluzione.', case: ['NZXT H5 Flow', 'Bianco'], mobo: 'Gigabyte B650 Aorus Elite AX', cpu: 'AMD Ryzen 7 7800X3D', gpu: 'MSI Gaming Trio GeForce RTX 5070 Ti', ram: ['Corsair Vengeance DDR5 6000MHz 32GB', 'Nero'], cool: 'Corsair iCUE H100i Elite', psu: 'Gigabyte UD850GM PG5 850W', ssd: ['Samsung 990 Pro 1TB'], rgb: { palette: 'oceano', effetto: 'onda' } }),
  costruisci({ id: 'mini-itx', nome: 'Mini ITX Build', uso: 'Ultra compatto', descrizione: 'Mini-ITX con dissipatore low profile e RTX 4060 in meno di 20 litri, silenziosa e discreta.', case: ['Fractal Design Terra'], mobo: 'MSI MPG B650I Edge WiFi', cpu: 'AMD Ryzen 5 7600', gpu: 'MSI Ventus 2X GeForce RTX 4060', ram: ['Kingston Fury Beast DDR5 6000MHz 32GB', 'Nero'], cool: 'Noctua NH-L12S', psu: 'Corsair SF750 750W', ssd: ['Samsung 990 EVO Plus 2TB'], fans: [['Noctua NF-A14 PWM'], ['Noctua NF-A12x25 PWM']], rgb: { attivo: false } }),
  costruisci({ id: 'white-theme', nome: 'White Theme', uso: 'Tema bianco', descrizione: 'Case O11 bianco, RX 9070 XT bianca e AIO bianco: una build luminosa con cavi intrecciati in tinta.', case: ['Lian Li O11 Dynamic EVO', 'Bianco'], mobo: 'Gigabyte Z790 Aorus Elite AX', cpu: 'Intel Core i7-14700K', gpu: 'Sapphire Pure Radeon RX 9070 XT White', ram: ['G.Skill Trident Z5 RGB DDR5 6000MHz 32GB', 'Bianco'], cool: 'Lian Li Galahad II Trinity 360', psu: 'Corsair RM1000x 1000W', ssd: ['Crucial T500 2TB'], fans: [[SL, 'Bianco']], cavi: ['Corsair Kit cavi sleeved Type 5 Gen 5 Bianco'], rgb: { palette: 'ghiaccio', effetto: 'onda' } }),
  costruisci({ id: 'black-theme', nome: 'Black Theme', uso: 'Tema nero', descrizione: 'Tutto nero e carbone con Ryzen 9 7950X3D e RTX 4080 Super: potente, sobria e discreta.', case: ['Corsair 5000D Airflow'], mobo: 'ASUS ROG Strix B650E-F Gaming WiFi', cpu: 'AMD Ryzen 9 7950X3D', gpu: 'ASUS ROG Strix GeForce RTX 4080 Super', ram: ['Corsair Vengeance DDR5 6000MHz 32GB', 'Nero'], cool: 'Corsair A115', psu: 'Corsair RM1000x 1000W', ssd: ['WD Black SN850X 2TB'], fans: [['Corsair iCUE SP120 RGB Elite (3 pezzi)', 'Nero']], cavi: ['Corsair Kit cavi sleeved Type 5 Gen 5 Nero'], rgb: { palette: 'rosso', effetto: 'respiro', intensita: 0.6 } }),
  costruisci({ id: 'cyberpunk', nome: 'Cyberpunk Theme', uso: 'Tema neon', descrizione: 'Neon giallo, ciano e magenta: O11 EVO, RTX 5070 Ti e Strimer con effetto cascata.', case: ['Lian Li O11 Dynamic EVO', 'Nero'], mobo: 'MSI MAG Z790 Tomahawk WiFi', cpu: 'Intel Core i7-14700K', gpu: 'MSI Gaming Trio GeForce RTX 5070 Ti', ram: ['Corsair Vengeance RGB DDR5 6000MHz 32GB', 'Nero'], cool: 'NZXT Kraken Elite 360', psu: 'Corsair RM1000x 1000W', ssd: ['Samsung 990 Pro 2TB'], fans: [['Corsair iCUE LINK QX120 RGB (3 pezzi)']], cavi: ['Lian Li Strimer Plus V2 24 pin'], rgb: { palette: 'cyber', effetto: 'cascata', intensita: 1, velocita: 0.7 } }),
  costruisci({ id: 'minimal', nome: 'Minimal Theme', uso: 'Design essenziale', descrizione: 'North bianco con dettagli in legno, ventole Noctua e RAM in tinta: pulita come un oggetto di design.', case: ['Fractal Design North', 'Bianco'], mobo: 'MSI MAG B650 Tomahawk WiFi', cpu: 'AMD Ryzen 5 7600X', gpu: 'MSI Ventus 3X GeForce RTX 5060 Ti 16GB', ram: ['Kingston Fury Beast DDR5 6000MHz 32GB', 'Bianco'], cool: 'be quiet! Pure Rock Pro 3', psu: 'Seasonic Focus GX 850W', ssd: ['Crucial T500 1TB'], fans: [['Noctua NF-A14 PWM'], ['Noctua NF-A12x25 PWM']], rgb: { attivo: false } }),
]
