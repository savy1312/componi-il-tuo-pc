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

## 3. Aggiornamenti
Gli aggiornamenti si fanno dal sito. Ogni pubblicazione genera `version.json`: l'app lo controlla all'avvio e,
se la versione è cambiata, mostra un avviso con il link alla pagina **Scarica**, dove si preme «Aggiorna ora».
Per una nuova versione: aumenta `version` in `package.json`, fai commit e push (Vercel ripubblica da solo).

## 4. Accesso con Google
1. Google Cloud Console → *API e servizi* → *Credenziali* → *Crea credenziali* → **ID client OAuth** → tipo **Applicazione web**.
2. In *Origini JavaScript autorizzate* inserisci l'indirizzo del sito (es. `https://componi-il-tuo-pc.vercel.app`).
3. Copia l'ID client e impostalo come variabile `VITE_GOOGLE_CLIENT_ID` (su Vercel: Settings → Environment Variables), poi ripubblica.
Senza ID il pulsante «Continua con Google» non compare e resta il profilo locale.
