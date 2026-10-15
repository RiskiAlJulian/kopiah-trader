// Fungsi server Vercel: perantara ke Twelve Data supaya API key TIDAK ikut ke browser.
// Isi di Vercel > Settings > Environment Variables (TANPA awalan VITE_):
//   TWELVE_DATA_API_KEY
// Hanya dua endpoint dan parameter yang diizinkan, jadi proxy ini tidak bisa dipakai
// untuk memanggil hal lain. Respons di-cache di CDN Vercel supaya kuota hemat dan
// banyak pengunjung berbagi satu request.

const BASE = 'https://api.twelvedata.com'
const TTL = { quote: 20, time_series: 60 } // detik cache CDN per endpoint
const INTERVALS = ['1min', '5min', '15min', '30min', '1h', '4h', '1day']
const SYMBOL_RE = /^[A-Za-z0-9./:_-]{1,24}$/

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'method_not_allowed' })
  }
  const key = process.env.TWELVE_DATA_API_KEY
  if (!key) return res.status(503).json({ error: 'not_configured' })

  const q = req.query || {}
  const path = String(q.path || '')
  const symbol = String(q.symbol || '')
  if (!Object.prototype.hasOwnProperty.call(TTL, path) || !SYMBOL_RE.test(symbol)) {
    return res.status(400).json({ error: 'bad_request' })
  }

  const params = new URLSearchParams({ symbol, apikey: key })
  if (path === 'time_series') {
    const interval = String(q.interval || '')
    if (!INTERVALS.includes(interval)) return res.status(400).json({ error: 'bad_request' })
    const size = Math.min(Math.max(parseInt(q.outputsize, 10) || 300, 1), 500)
    params.set('interval', interval)
    params.set('outputsize', String(size))
    params.set('timezone', 'UTC')
  }

  try {
    const r = await fetch(`${BASE}/${path}?${params}`, { signal: AbortSignal.timeout(10000) })
    const raw = (await r.text()).split(key).join('***') // jaga-jaga key ikut tercetak di pesan error
    let data
    try { data = JSON.parse(raw) } catch { return res.status(502).json({ error: 'upstream_error' }) }
    const ok = r.ok && data?.status !== 'error'
    res.setHeader('Cache-Control', ok ? `public, s-maxage=${TTL[path]}, stale-while-revalidate=${TTL[path] * 2}` : 'no-store')
    return res.status(r.status).json(data)
  } catch (e) {
    console.error('market error:', e && (e.message || e))
    return res.status(502).json({ error: 'upstream_error' })
  }
}
