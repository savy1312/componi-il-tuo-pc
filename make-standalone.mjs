// Inlines the Vite build (dist/) into one HTML file that opens with a double click.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const html = readFileSync('dist/index.html', 'utf8')

const out = html
  .replace(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, (_, href) => {
    const css = readFileSync(join('dist', href), 'utf8')
    return `<style>${css}</style>`
  })
  .replace(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g, (_, src) => {
    const js = readFileSync(join('dist', src), 'utf8').replace(/<\/script/gi, '<\\/script')
    return `<script type="module">${js}</script>`
  })

writeFileSync('standalone.html', out)
console.log('standalone.html written,', out.length, 'bytes')
