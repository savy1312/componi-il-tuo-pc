import { META } from '../data/categorie'
import { useMiniatura } from '../scene/miniatureStore'
import type { Componente } from '../types'

/** Immagine 3D del componente (renderizzata in tempo reale), con segnaposto mentre si prepara. */
export default function ImgComponente({ c, className = '', iconSize = 22 }: { c: Componente; className?: string; iconSize?: number }) {
  const url = useMiniatura(c)
  const Icona = META[c.categoria].icona
  return (
    <div className={`relative grid place-items-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_35%,#434859_0%,#22242d_75%)] ${className}`}>
      {url ? (
        <img src={url} alt={`${c.nome}, immagine 3D`} loading="lazy" draggable={false} className="h-full w-full object-contain anim-fade" />
      ) : (
        <Icona size={iconSize} className="animate-pulse text-mut/60" aria-hidden="true" />
      )}
    </div>
  )
}
