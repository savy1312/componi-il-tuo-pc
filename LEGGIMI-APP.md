# Componi il tuo PC — app per telefono

Il sito è anche un'app installabile (PWA): icona sulla schermata Home, schermo intero, uso offline.

## 1. Pubblica il sito (serve HTTPS)
1. `npm install`
2. `npm run build`  → crea la cartella `dist/`
3. Carica **tutto il contenuto di `dist/`** su un hosting con HTTPS, ad esempio:
   - Netlify: trascina la cartella `dist` su https://app.netlify.com/drop
   - Cloudflare Pages, Vercel o GitHub Pages
   (funziona anche in una sottocartella: i percorsi sono relativi)

## 2. Installa sul telefono
- **Android (Chrome)**: apri l'indirizzo → «Installa l'app» (oppure ⋮ → Installa app).
- **iPhone (Safari)**: apri l'indirizzo → Condividi → «Aggiungi alla schermata Home».

Per provarla sul PC: `npm run build && npm run preview`, poi apri http://localhost:4173
(localhost è considerato sicuro, quindi l'installazione funziona anche lì).

Nota: `standalone.html` aperto con doppio clic resta utilizzabile, ma non può essere installato come app.
