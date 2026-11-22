/** Accesso e registrazione con Google (Google Identity Services, nessun server nostro). */

export const GOOGLE_CLIENT_ID: string = (import.meta.env?.VITE_GOOGLE_CLIENT_ID ?? '').trim()
export const googleAttivo = GOOGLE_CLIENT_ID.length > 10

export interface ProfiloGoogle {
  sub: string
  nome: string
  email: string
  foto?: string
}

interface Gsi {
  accounts: {
    id: {
      initialize: (c: { client_id: string; callback: (r: { credential?: string }) => void; auto_select?: boolean; cancel_on_tap_outside?: boolean; ux_mode?: 'popup' | 'redirect' }) => void
      renderButton: (el: HTMLElement, o: Record<string, unknown>) => void
      disableAutoSelect: () => void
    }
  }
}

declare global {
  interface Window {
    google?: Gsi
  }
}

let caricamento: Promise<Gsi> | null = null

export function caricaGoogle(): Promise<Gsi> {
  if (window.google?.accounts) return Promise.resolve(window.google)
  caricamento ??= new Promise<Gsi>((ok, ko) => {
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.onload = () => (window.google?.accounts ? ok(window.google) : ko(new Error('gsi')))
    s.onerror = () => {
      caricamento = null
      ko(new Error('rete'))
    }
    document.head.appendChild(s)
  })
  return caricamento
}

const base64Url = (t: string) => {
  const b = atob(t.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(t.length / 4) * 4, '='))
  return new TextDecoder().decode(Uint8Array.from(b, (c) => c.charCodeAt(0)))
}

/** Legge il token di Google e controlla destinatario, emittente e scadenza. Ritorna null se non è valido. */
export function leggiCredenziale(jwt: string, clientId: string = GOOGLE_CLIENT_ID): ProfiloGoogle | null {
  try {
    const parti = jwt.split('.')
    if (parti.length !== 3) return null
    const d = JSON.parse(base64Url(parti[1])) as Record<string, unknown>
    const iss = String(d.iss ?? '')
    if (d.aud !== clientId) return null
    if (iss !== 'accounts.google.com' && iss !== 'https://accounts.google.com') return null
    if (typeof d.exp !== 'number' || d.exp * 1000 < Date.now() - 60_000) return null
    if (d.email_verified === false || typeof d.email !== 'string' || typeof d.sub !== 'string') return null
    return {
      sub: d.sub,
      email: d.email,
      nome: String(d.name ?? d.given_name ?? d.email.split('@')[0]).slice(0, 60),
      foto: typeof d.picture === 'string' && d.picture.startsWith('https://') ? d.picture : undefined,
    }
  } catch {
    return null
  }
}

export function esciDaGoogle() {
  try {
    window.google?.accounts.id.disableAutoSelect()
  } catch {
    /* niente da fare */
  }
}
