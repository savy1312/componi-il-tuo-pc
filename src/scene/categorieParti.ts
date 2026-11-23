import type { Categoria } from '../types'

/** Dal nome interno di una parte 3D alla categoria del componente. */
export const catDaChiave = (k: string): Categoria | null => {
  if (k.startsWith('case-') || k.startsWith('cop-')) return 'case'
  if (k.startsWith('mb-')) return 'scheda-madre'
  if (k.startsWith('cpu-')) return 'cpu'
  if (k.startsWith('cool-')) return 'dissipatore'
  if (k.startsWith('ram-')) return 'ram'
  if (k.startsWith('gpu-')) return 'gpu'
  if (k.startsWith('ssd-')) return 'ssd'
  if (k.startsWith('psu-')) return 'alimentatore'
  if (k.startsWith('cavi-')) return 'cavi'
  if (k.startsWith('ven-')) return 'ventole'
  return null
}
