/* Service worker di «Componi il tuo PC»: l'app funziona anche senza connessione. */
const VERSIONE = 'componi-pc-v3'
const BASE = self.registration.scope
const PRECACHE = ['', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(VERSIONE)
      .then((c) => c.addAll(PRECACHE.map((p) => new URL(p, BASE).href)))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((chiavi) => Promise.all(chiavi.filter((k) => k !== VERSIONE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return // risorse esterne (es. accesso Google): rete normale
  if (url.pathname.endsWith('/version.json')) return // sempre dalla rete: serve a sapere se c'è un aggiornamento

  // pagine: prima la rete (versione aggiornata), poi la copia salvata
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((r) => {
          const copia = r.clone()
          caches.open(VERSIONE).then((c) => c.put(new URL('index.html', BASE).href, copia))
          return r
        })
        .catch(() => caches.match(new URL('index.html', BASE).href).then((r) => r || caches.match(new URL('', BASE).href))),
    )
    return
  }

  // file dell'app: copia salvata subito, aggiornata in background
  e.respondWith(
    caches.match(req).then((salvato) => {
      const rete = fetch(req)
        .then((r) => {
          if (r.ok) {
            const copia = r.clone()
            caches.open(VERSIONE).then((c) => c.put(req, copia))
          }
          return r
        })
        .catch(() => salvato)
      return salvato || rete
    }),
  )
})
