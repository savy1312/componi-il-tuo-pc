import assert from 'node:assert/strict'
import { HARDWARE, per, trova } from '../src/data/hardware'
import { PRESET } from '../src/data/presets'
import { analizza, conComponente, selezioneVuota, valutaCandidato } from '../src/engine/compat'
import { corrispondeRicerca, elabora, STATO_INIZIALE } from '../src/engine/catalogo'
import { CATEGORIE } from '../src/types'
import { leggiCredenziale } from '../src/lib/google'

let ok = 0
const test = (nome: string, fn: () => void) => {
  try {
    fn()
    ok++
    console.log('  ✓', nome)
  } catch (e) {
    console.error('  ✗', nome, '\n   ', (e as Error).message)
    process.exitCode = 1
  }
}
const get = (nome: string, colore?: string) => {
  const c = HARDWARE.find((x) => x.nome === nome && (!colore || x.colore === colore))
  if (!c) throw new Error('Componente non trovato: ' + nome)
  return c
}

console.log('Dataset')
test('id univoci', () => assert.equal(new Set(HARDWARE.map((c) => c.id)).size, HARDWARE.length))
test('quantità minime per categoria', () => {
  const min: Record<string, number> = { case: 12, 'scheda-madre': 14, cpu: 18, gpu: 20, ram: 16, dissipatore: 14, ssd: 14, alimentatore: 14, ventole: 14, cavi: 10 }
  for (const c of CATEGORIE) assert.ok(per(c).length >= min[c], `${c}: ${per(c).length} < ${min[c]}`)
})
test('campi obbligatori e prezzi sensati', () => {
  for (const c of HARDWARE) {
    assert.ok(c.nome && c.marca && c.descrizione.length > 20, c.id)
    assert.ok(c.prezzo > 0 && c.prezzo < 5000, c.id)
    assert.ok(['Entry Level', 'Mid Range', 'High End', 'Enthusiast'].includes(c.fascia), c.id)
  }
})

console.log('Preset')
for (const p of PRESET) {
  test(`preset "${p.nome}" senza incompatibilità critiche`, () => {
    const a = analizza(p.sel)
    const crit = a.problemi.filter((x) => x.gravita === 'critico').map((x) => x.messaggio)
    assert.deepEqual(crit, [])
    assert.deepEqual(a.mancanti, [])
    assert.ok(a.completabile)
  })
}
test('20 preset', () => assert.equal(PRESET.length, 20))
console.log('  (avvisi nei preset)')
for (const p of PRESET) {
  const a = analizza(p.sel)
  const att = a.problemi.filter((x) => x.gravita === 'attenzione')
  if (att.length) console.log('   ·', p.nome, '→', att.map((x) => x.messaggio).join(' | '))
}

console.log('Regole di compatibilità')
test('socket CPU / scheda madre', () => {
  const s = conComponente(conComponente(selezioneVuota(), get('MSI MAG B650 Tomahawk WiFi')), get('Intel Core i5-14600K'))
  assert.ok(analizza(s).problemi.some((x) => x.id === 'socket' && x.gravita === 'critico'))
})
test('RAM DDR4 su scheda AM5', () => {
  const s = conComponente(conComponente(selezioneVuota(), get('MSI MAG B650 Tomahawk WiFi')), get('Kingston Fury Beast DDR4 3200MHz 16GB'))
  const p = analizza(s).problemi.find((x) => x.id === 'ram-tipo')
  assert.ok(p && p.messaggio.includes('DDR4') && p.messaggio.includes('AM5'))
})
test('GPU troppo lunga per il case con differenza in mm', () => {
  const s = conComponente(conComponente(selezioneVuota(), get('Cooler Master NR200P')), get('MSI Suprim GeForce RTX 5090'))
  const p = analizza(s).problemi.find((x) => x.id === 'gpu-lunga')
  assert.ok(p, 'problema non trovato')
  assert.ok(/troppo lunga di 28 mm/.test(p.messaggio), p.messaggio)
})
test('formato scheda madre non supportato dal case', () => {
  const s = conComponente(conComponente(selezioneVuota(), get('Cooler Master NR200P')), get('MSI MAG B650 Tomahawk WiFi'))
  assert.ok(analizza(s).problemi.some((x) => x.id === 'formato'))
})
test('AIO 360 non compatibile con case compatto', () => {
  const s = conComponente(conComponente(selezioneVuota(), get('Cooler Master NR200P')), get('Arctic Liquid Freezer III 360'))
  assert.ok(analizza(s).problemi.some((x) => x.id === 'aio-case'))
})
test('dissipatore troppo alto', () => {
  const s = conComponente(conComponente(selezioneVuota(), get('Fractal Design Terra')), get('Noctua NH-D15'))
  assert.ok(analizza(s).problemi.some((x) => x.id === 'cooler-alto'))
})
test('alimentatore insufficiente con messaggio in watt', () => {
  let s = selezioneVuota()
  for (const n of ['Intel Core i9-14900K', 'MSI Suprim GeForce RTX 5090', 'Corsair CX650 650W']) s = conComponente(s, get(n))
  const p = analizza(s).problemi.find((x) => x.id === 'potenza')
  assert.ok(p && /supera la capacità dell’alimentatore di \d+ W/.test(p.messaggio))
})
test('connettori PCIe insufficienti', () => {
  let s = selezioneVuota()
  for (const n of ['MSI Suprim GeForce RTX 5090', 'Seasonic Core GC 650W']) s = conComponente(s, get(n))
  assert.ok(analizza(s).problemi.some((x) => x.id === 'pcie-conn'))
})
test('slot M.2 insufficienti', () => {
  let s = selezioneVuota()
  s = conComponente(s, get('Gigabyte B550I Aorus Pro AX'))
  s = conComponente(s, get('Samsung 990 Pro 1TB'))
  s = conComponente(s, get('Samsung 990 Pro 2TB'))
  assert.ok(analizza(s).problemi.some((x) => x.id === 'm2'))
})
test('valutaCandidato segnala CPU AM4 con scheda AM5', () => {
  const s = conComponente(selezioneVuota(), get('MSI MAG B650 Tomahawk WiFi'))
  assert.equal(valutaCandidato(s, get('AMD Ryzen 5 5600')).livello, 'critico')
  assert.equal(valutaCandidato(s, get('AMD Ryzen 5 7600')).livello, 'ok')
})
test('build vuota = configurazione incompleta', () => assert.equal(analizza(selezioneVuota()).stato, 'Configurazione incompleta'))
test('prezzo e consumo sommati', () => {
  const p = PRESET[0]
  const a = analizza(p.sel)
  const tot = [p.sel.case, p.sel['scheda-madre'], p.sel.cpu, p.sel.gpu, p.sel.ram, p.sel.dissipatore, p.sel.alimentatore, ...p.sel.ssd, ...p.sel.ventole, ...p.sel.cavi].reduce((s, id) => s + (trova(id)?.prezzo ?? 0), 0)
  assert.equal(a.prezzo, tot)
  assert.ok(a.tel.carico > 300)
})

console.log('Ricerca e filtri')
test('ricerca multi-campo', () => {
  assert.ok(corrispondeRicerca(get('Corsair RM850x 850W'), '850W'))
  assert.ok(corrispondeRicerca(get('Corsair Vengeance DDR5 6000MHz 32GB', 'Nero'), 'DDR5 6000'))
  assert.ok(corrispondeRicerca(get('NZXT H7 Flow', 'Bianco'), 'case bianco'))
  assert.ok(!corrispondeRicerca(get('NZXT H7 Flow', 'Nero'), 'bianco'))
})
test('elabora: solo compatibili nasconde le CPU incompatibili', () => {
  const s = conComponente(selezioneVuota(), get('MSI MAG B650 Tomahawk WiFi'))
  const esiti = new Map(per('cpu').map((c) => [c.id, valutaCandidato(s, c)]))
  const r = elabora('cpu', { ...STATO_INIZIALE, soloCompatibili: true }, esiti)
  assert.ok(r.length > 0 && r.every((c) => c.socket === 'AM5'))
})

console.log('Accesso con Google')
const jwt = (o: object) => `x.${Buffer.from(JSON.stringify(o)).toString('base64url')}.y`
const CID = 'abc123.apps.googleusercontent.com'
const buono = { iss: 'https://accounts.google.com', aud: CID, exp: Math.floor(Date.now() / 1000) + 3600, sub: '1', email: 'mario@example.com', email_verified: true, name: 'Mario Rossi', picture: 'https://lh3.googleusercontent.com/a' }
test('credenziale valida letta correttamente', () => {
  const p = leggiCredenziale(jwt(buono), CID)
  assert.equal(p?.email, 'mario@example.com')
  assert.equal(p?.nome, 'Mario Rossi')
})
test('credenziale per un altro client o scaduta è rifiutata', () => {
  assert.equal(leggiCredenziale(jwt({ ...buono, aud: 'altro' }), CID), null)
  assert.equal(leggiCredenziale(jwt({ ...buono, exp: 10 }), CID), null)
  assert.equal(leggiCredenziale(jwt({ ...buono, iss: 'https://evil.example' }), CID), null)
  assert.equal(leggiCredenziale(jwt({ ...buono, email_verified: false }), CID), null)
  assert.equal(leggiCredenziale('non-un-token', CID), null)
})
test('foto non https ignorata, nome accentato letto bene', () => {
  const p = leggiCredenziale(jwt({ ...buono, picture: 'http://x/y', name: 'Niccolò Perché' }), CID)
  assert.equal(p?.foto, undefined)
  assert.equal(p?.nome, 'Niccolò Perché')
})

console.log(`\n${ok} test superati${process.exitCode ? ' — CI SONO FALLIMENTI' : ''}`)
