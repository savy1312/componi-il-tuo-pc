/// <reference types="vite/client" />

declare const __APP_VERSION__: string
declare const __APP_BUILD__: string

interface ImportMetaEnv {
  /** ID client OAuth di Google (pubblico): abilita «Continua con Google». */
  readonly VITE_GOOGLE_CLIENT_ID?: string
}
