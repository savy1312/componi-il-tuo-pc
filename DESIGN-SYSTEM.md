# Design system — Componi il tuo PC

Tema scuro tecnico (blu notte), accenti ciano, smeraldo, ambra e rosso. Tutti i valori stanno in `src/index.css`
(blocco `@theme` per Tailwind e `:root` per i token di movimento/layout).

| Gruppo | Token | Uso |
|---|---|---|
| Superfici | `obs #060c20`, `carb #0a1330`, `ant #0e1a3d`, `tec #14234f`, `sup #1a2c60` | sfondo, pannelli, card, rialzi |
| Testo | `txt #eaf1ff`, `mut #93a8d2` | primario, secondario (più chiaro con `prefers-contrast: more`) |
| Accenti | `cy #22d3ee`, `ind #6366f1` | azione principale, selezione |
| Stato | `em #10b981` successo · `am #f59e0b` avviso · `rd #ef4444` errore · `cy` informazione | badge, evidenziazioni 3D |
| Raggi | `rounded-ctrl` 0.5rem · `rounded-card` 1rem · `rounded-panel` 1.25rem | controlli, card, pannelli |
| Ombre | `shadow-panel`, `shadow-glow` | pannelli, elemento attivo |
| Movimento | `--durata-rapida/base/lenta` 120/200/400 ms · `--ease-soft` | hover, apertura, transizioni |
| Layout | `--barra-alta`, `--colonna-sx/dx/compressa` | barre e colonne della pagina «Il tuo PC» |
| Livelli | `--z-scena-ui`, `--z-pannelli`, `--z-menu`, `--z-modali` | sovrapposizioni |
| Focus | `--anello-focus` | stato di focus da tastiera |
| Breakpoint | Tailwind: `sm 640`, `md 768`, `lg 1024`, `xl 1280` | `lg` = layout a 3 colonne |

Accessibilità: `prefers-reduced-motion` disattiva le animazioni, `prefers-contrast: more` alza contrasto di testi e bordi.
Il tema chiaro non è previsto.

## Qualità grafica
`src/lib/qualita.ts` definisce 5 profili (Bassa, Media, Alta, Ultra, 4K) e la modalità Auto, che misura gli FPS
(`src/scene/prestazioni.tsx`) e sale o scende di un livello. Ogni profilo imposta risoluzione, ombre, occlusione
ambientale, anti-aliasing, bloom, riflessi del pavimento, risoluzione dell'ambiente, numero di luci e anisotropia delle texture.
