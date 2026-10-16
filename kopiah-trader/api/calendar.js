// Fungsi server Vercel: perantara ke FMP (Economic Calendar) supaya API key TIDAK ikut ke browser.
// Isi di Vercel > Settings > Environment Variables (TANPA awalan VITE_):
//   FMP_API_KEY
// Kalau FMP mengganti alamat API lagi, cukup ubah BASE di bawah.

const BASE = 'https://financialmodelingprep.com/stable/economic-calendar'
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const MAX_RANGE_DAYS = 62
const TTL = 300 // detik cache CDN

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'method_not_allowed' })
  }
  // Bersihkan spasi/enter/tanda kutip yang sering ikut tertempel saat copy-paste key.
  const key = (process.env.FMP_API_KEY || '').trim().replace(/^["']|["']$/g, '')
  if (!key) return res.status(503).json({ error: 'not_configured' })

  const from = String((req.query || {}).from || '')
  const to = String((req.query || {}).to || '')
  const span = (Date.parse(to) - Date.parse(from)) / 86_400_000
  if (!DATE_RE.test(from) || !DATE_RE.test(to) || !(span >= 0 && span <= MAX_RANGE_DAYS)) {
    return res.status(400).json({ error: 'bad_request' })
  }

  try {
    const r = await fetch(`${BASE}?${new URLSearchParams({ from, to, apikey: key })}`, { signal: AbortSignal.timeout(10000) })
    const raw = (await r.text()).split(key).join('***')
    let data
    try { data = JSON.parse(raw) } catch {
      // Balasan bukan JSON (mis. teks penolakan plan). Teruskan status dan cuplikannya untuk diagnosis.
      res.setHeader('Cache-Control', 'no-store')
      return res.status(502).json({ error: 'upstream_error', upstream_status: r.status, detail: raw.slice(0, 200) })
    }
    const ok = r.ok && Array.isArray(data)
    res.setHeader('Cache-Control', ok ? `public, s-maxage=${TTL}, stale-while-revalidate=${TTL}` : 'no-store')
    return res.status(r.status).json(data)
  } catch (e) {
    console.error('calendar error:', e && (e.message || e))
    const detail = String((e && (e.name + ': ' + e.message)) || e).split(key).join('***').slice(0, 200)
    return res.status(502).json({ error: 'upstream_error', detail })
  }
}
