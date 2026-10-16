// Fungsi server Vercel: perantara ke feed kalender ekonomi gratis (Forex Factory via Fair Economy).
// Tidak butuh API key. Feed ini tidak resmi (tanpa jaminan layanan) dan hanya memuat MINGGU INI,
// dengan kolom forecast dan previous, tanpa nilai actual.
// Respons di-cache supaya feed tidak dipanggil terlalu sering (feed membatasi request).

const FEED = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json'
const TTL = 900 // detik cache CDN
const WARM_MS = 5 * 60 * 1000 // cache di memori instance yang sama

let cache = null // { at, data }

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  if (cache && Date.now() - cache.at < WARM_MS) {
    res.setHeader('Cache-Control', `public, s-maxage=${TTL}, stale-while-revalidate=${TTL}`)
    return res.status(200).json(cache.data)
  }

  let status = 0
  let detail = ''
  try {
    const r = await fetch(FEED, {
      signal: AbortSignal.timeout(10000),
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; KopiahTrader/1.0)' }
    })
    status = r.status
    const raw = await r.text()
    let data = null
    try { data = JSON.parse(raw) } catch { detail = raw.slice(0, 200) }
    if (r.ok && Array.isArray(data)) {
      cache = { at: Date.now(), data }
      res.setHeader('Cache-Control', `public, s-maxage=${TTL}, stale-while-revalidate=${TTL}`)
      return res.status(200).json(data)
    }
  } catch (e) {
    detail = String((e && (e.name + ': ' + e.message)) || e).slice(0, 200)
    console.error('calendar error:', detail)
  }

  // Gagal: pakai data terakhir yang tersimpan (walau sudah agak lama) daripada menampilkan kosong.
  if (cache) {
    res.setHeader('Cache-Control', 'public, s-maxage=60')
    return res.status(200).json(cache.data)
  }
  res.setHeader('Cache-Control', 'no-store')
  return res.status(502).json({ error: 'upstream_error', upstream_status: status || undefined, detail })
}
