import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { registraServiceWorker } from './lib/pwa'

registraServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// animazione di apertura: resta almeno ~2,2 secondi, poi sfuma
const inizio = performance.now()
const chiudiSplash = () => {
  const el = document.getElementById('splash')
  if (!el) return
  const attesa = Math.max(0, 2200 - (performance.now() - inizio))
  setTimeout(() => {
    el.classList.add('fuori')
    setTimeout(() => el.remove(), 650)
  }, attesa)
}
requestAnimationFrame(() => requestAnimationFrame(chiudiSplash))
