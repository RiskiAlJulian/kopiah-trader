// Fungsi server Vercel: menjalankan siklus sinyal otomatis KOPIAH TRADER ANALIS untuk semua timeframe.
// Dipanggil terjadwal (mis. tiap 5 menit) oleh layanan cron dengan header:
//   Authorization: Bearer <CRON_SECRET>
//
// Variabel di Vercel (tanpa VITE_ untuk yang rahasia):
//   CRON_SECRET                 kata sandi panggilan terjadwal (buat sendiri, acak, panjang)
//   SUPABASE_SERVICE_ROLE_KEY   key service_role dari Supabase (RAHASIA, jangan pernah di kode browser)
//   TWELVE_DATA_API_KEY         sudah ada
//   VITE_SUPABASE_URL           sudah ada

import { timingSafeEqual } from 'node:crypto'
import { TIMEFRAMES, configFor, runCycle, shouldRun } from './_lib/zoneSignals.js'

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

async function fetchCandles(apiKey, interval, symbol) {
  const params = new URLSearchParams({ symbol, interval, outputsize: '500', timezone: 'UTC', apikey: apiKey })
  const res = await fetch(`https://api.twelvedata.com/time_series?${params}`, { signal: AbortSignal.timeout(15000) })
  const raw = (await res.text()).split(apiKey).join('***')
  let data
  try { data = JSON.parse(raw) } catch { throw new Error(`Twelve Data bukan JSON (HTTP ${res.status})`) }
  if (data.status === 'error' || !Array.isArray(data.values)) throw new Error(`Twelve Data: ${data.message || 'respons tidak valid'}`)
  // Candle harian memakai tanggal saja ("2026-10-16"), yang lain "2026-10-16 15:15:00".
  const toSec = (d) => Math.floor(Date.parse((d.length <= 10 ? `${d}T00:00:00` : d.replace(' ', 'T')) + 'Z') / 1000)
  return data.values
    .map((v) => ({ time: toSec(v.datetime), open: +v.open, high: +v.high, low: +v.low, close: +v.close }))
    .filter((c) => isFinite(c.time) && isFinite(c.high) && isFinite(c.low))
    .sort((a, b) => a.time - b.time)
}

/** Satu siklus untuk satu timeframe: ambil candle, baca catatan, hitung, simpan. */
async function runTimeframe(tf, { base, serviceKey, tdKey, nowMs }) {
  const cfg = configFor(tf)
  const candles = await fetchCandles(tdKey, cfg.interval, cfg.providerSymbol)

  // Sinyal timeframe ini yang masih mungkin aktif, beserta event-nya (juga dipakai untuk batas harian).
  const since = new Date(nowMs - (cfg.expireHours + 24) * 3600e3).toISOString()
  const signals = await sb(base, serviceKey,
    `analyst_signals?select=*,events:analyst_signal_events(type,event_time,price)&symbol=eq.${cfg.symbol}&timeframe=eq.${tf}&created_at=gte.${encodeURIComponent(since)}&order=created_at.asc`)

  const out = runCycle({ candles, nowMs, signals: signals || [], cfg })

  // on_conflict + ignore-duplicates: dua siklus yang tumpang tindih tidak bisa membuat catatan ganda.
  if (out.newSignals.length) {
    await sb(base, serviceKey, 'analyst_signals?on_conflict=leg_key,stage', { method: 'POST', body: out.newSignals, prefer: 'resolution=ignore-duplicates,return=minimal' })
  }
  if (out.newEvents.length) {
    await sb(base, serviceKey, 'analyst_signal_events?on_conflict=signal_id,type', { method: 'POST', body: out.newEvents, prefer: 'resolution=ignore-duplicates,return=minimal' })
  }
  return {
    candles: candles.length,
    newSignals: out.newSignals.map((x) => `${x.direction} ${x.stage} @${x.entry}`),
    newEvents: out.newEvents.map((e) => e.type),
    notes: out.notes
  }
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

  const nowMs = Date.now()
  // ?force=1 menjalankan semua timeframe (untuk tes manual); ?tf=1H hanya satu timeframe.
  const only = String(req.query?.tf || '')
  const force = req.query?.force === '1' || !!only
  const all = Object.keys(TIMEFRAMES)
  const due = all.filter((tf) => (only ? tf === only : force || shouldRun(tf, nowMs)))
  if (only && !TIMEFRAMES[only]) return res.status(400).json({ error: 'bad_timeframe' })

  const settled = await Promise.allSettled(due.map((tf) => runTimeframe(tf, { base, serviceKey, tdKey, nowMs })))
  const ran = {}, errors = {}
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') ran[due[i]] = r.value
    else { errors[due[i]] = String(r.reason && r.reason.message).slice(0, 200); console.error('analyst-run', due[i], errors[due[i]]) }
  })
  const failedAll = due.length > 0 && Object.keys(ran).length === 0
  return res.status(failedAll ? 502 : 200).json({
    ok: !failedAll, ran, skipped: all.filter((tf) => !due.includes(tf)),
    ...(Object.keys(errors).length ? { errors } : {})
  })
}
