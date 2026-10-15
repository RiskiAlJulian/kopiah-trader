import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Saat `npm run dev`, Vite tidak menjalankan folder api/ seperti Vercel.
// Plugin kecil ini menjalankan api/market.js dan api/calendar.js secara lokal
// memakai key dari file .env (TWELVE_DATA_API_KEY, FMP_API_KEY; tanpa awalan VITE_).
// api/chat.js (AI) tidak ikut; untuk mengetesnya lokal pakai `vercel dev`.
function devApi(): Plugin {
  const routes: Record<string, string> = { '/api/market': '/api/market.js', '/api/calendar': '/api/calendar.js' }
  return {
    name: 'dev-api',
    apply: 'serve',
    configureServer(server) {
      Object.assign(process.env, loadEnv('development', process.cwd(), ''))
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const file = routes[url.pathname]
        if (!file) return next()
        const mod = await server.ssrLoadModule(file)
        const shim: any = res
        shim.status = (code: number) => { res.statusCode = code; return shim }
        shim.json = (body: unknown) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)) }
        await mod.default({ method: req.method, query: Object.fromEntries(url.searchParams), headers: req.headers }, shim)
      })
    }
  }
}

export default defineConfig({ plugins: [react(), devApi()] })
