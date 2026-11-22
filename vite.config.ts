import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import pkg from './package.json'

const BUILD = new Date().toISOString()

/** Pubblica version.json accanto al sito: l'app lo legge per sapere se esiste una versione più nuova. */
function fileVersione(): Plugin {
  return {
    name: 'file-versione',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ versione: pkg.version, build: BUILD }) })
    },
  }
}

export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version), __APP_BUILD__: JSON.stringify(BUILD) },
  plugins: [react(), tailwindcss(), fileVersione()],
  build: { chunkSizeWarningLimit: 2000, rollupOptions: { output: { inlineDynamicImports: true } } },
})
