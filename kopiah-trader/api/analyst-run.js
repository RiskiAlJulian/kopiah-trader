// Fungsi server Vercel: menjalankan satu siklus sinyal otomatis KOPIAH TRADER ANALIS.
// Dipanggil terjadwal (mis. tiap 5 menit) oleh layanan cron dengan header:
//   Authorization: Bearer <CRON_SECRET>
//
// Variabel di Vercel (tanpa VITE_ untuk yang rahasia):
//   CRON_SECRET                 kata sandi panggilan terjadwal (buat sendiri, acak, panjang)
//   SUPABASE_SERVICE_ROLE_KEY   key service_role dari Supabase (RAHASIA, jangan pernah di kode browser)
//   TWELVE_DATA_API_KEY         sudah ada
//   VITE_SUPABASE_URL           sudah ada

import { timingSafeEqual } from 'node:crypto'
import { CONFIG, runCycle } from './_lib/fibSignals.js'

const clean = (v) => (v || '').trim().replace(/^["']|["']$/g, '')

async function sb(base, key, path, { method = 'GET', body, prefer } = {}) {
  const res = await fetch(`${base}/rest/v1/${path}`, {
    method,
    signal: AbortSignal.timeout(15000),
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  })
  const text = await res.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { /* abaikan */ }
  if (!res.ok) throw new Error(`Supabase ${method} ${path.split('?')[0]} HTTP ${res.status}: ${text.slice(0, 200)}`)
  return data
}

async function fetchCandles(apiKey) {
  const params = new URLSearchParams({ symbol: CONFIG.providerSymbol, interval: CONFIG.interval, outputsize: '500', timezone: 'UTC', apikey: apiKey })
  const res = await fetch(`https://api.twelvedata.com/time_series?${params}`, { signal: AbortSignal.timeout(15000) })
  const raw = (await res.text()).split(apiKey).join('***')
  let data
  try { data = JSON.parse(raw) } catch { throw new Error(`Twelve Data bukan JSON (HTTP ${res.status})`) }
  if (data.status === 'error' || !Array.isArray(data.values)) throw new Error(`Twelve Data: ${data.message || 'respons tidak valid'}`)
  return data.values
    .map((v) => ({ time: Math.floor(Date.parse(v.datetime.replace(' ', 'T') + 'Z') / 1000), open: +v.open, high: +v.high, low: +v.low, close: +v.close }))
    .filter((c) => isFinite(c.time) && isFinite(c.high) && isFinite(c.low))
    .sort((a, b) => a.time - b.time)
}

export default async function handler(req, res) {
  const secret = clean(process.env.CRON_SECRET)
  const base = clean(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)
  const serviceKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const tdKey = clean(process.env.TWELVE_DATA_API_KEY)
  if (!secret || !base || !serviceKey || !tdKey) return res.status(503).json({ error: 'not_configured' })
  // Spasi/enter di ujung (sering ikut saat copy-paste di layanan cron) diabaikan; perbandingan tahan serangan timing.
  const given = Buffer.from(String(req.headers?.authorization || '').trim())
  const expected = Buffer.from(`Bearer ${secret}`)
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return res.status(401).json({ error: 'unauthorized' })

  try {
    const nowMs = Date.now()
    const candles = await fetchCandles(tdKey)

    // Sinyal beberapa hari terakhir beserta event-nya (cukup untuk evaluasi dan batas harian).
    const since = new Date(nowMs - 5 * 86400e3).toISOString()
    const signals = await sb(base, serviceKey,
      `analyst_signals?select=*,events:analyst_signal_events(type,event_time,price)&symbol=eq.${CONFIG.symbol}&created_at=gte.${encodeURIComponent(since)}&order=created_at.asc`)

    const out = runCycle({ candles, nowMs, signals: signals || [] })

    // on_conflict + ignore-duplicates: dua siklus yang tumpang tindih tidak bisa membuat catatan ganda.
    if (out.newSignals.length) {
      await sb(base, serviceKey, 'analyst_signals?on_conflict=leg_key,stage', { method: 'POST', body: out.newSignals, prefer: 'resolution=ignore-duplicates,return=minimal' })
    }
    if (out.newEvents.length) {
      await sb(base, serviceKey, 'analyst_signal_events?on_conflict=signal_id,type', { method: 'POST', body: out.newEvents, prefer: 'resolution=ignore-duplicates,return=minimal' })
    }
    return res.status(200).json({
      ok: true, candles: candles.length, lastCandle: candles.at(-1)?.time,
      newSignals: out.newSignals.map((s) => `${s.direction} ${s.stage} @${s.entry}`),
      newEvents: out.newEvents.map((e) => `${e.type}`), notes: out.notes
    })
  } catch (e) {
    console.error('analyst-run error:', e && (e.message || e))
    return res.status(502).json({ error: 'run_failed', detail: String(e && e.message).slice(0, 300) })
  }
}
