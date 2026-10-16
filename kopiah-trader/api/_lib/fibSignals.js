// Mesin sinyal otomatis KOPIAH TRADER ANALIS (Fibonacci terbalik).
// Fungsi murni: tidak membaca jaringan atau database. Semua keputusan ditentukan
// oleh candle dan catatan sinyal yang diberikan, sehingga mudah diuji.
//
// ATURAN (dari pemilik aplikasi):
//  - Fib 1 (cut loss) di swing yang berlawanan arah, Fib 0 (TP max) di swing ujung leg.
//    BUY : Fib 1 = swing low, Fib 0 = swing high. SELL: kebalikannya.
//  - Entry di Fib 0.70 - 0.71 (dipakai 0.705). SL 60 pips, TP1 60, TP2 120, TP3 180 pips.
//  - Jika entry 0.705 kena SL dan harga belum menyentuh Fib 0.796: entry berikutnya di 0.796
//    dengan SL/TP yang sama. Jika 0.796 juga kena SL: cari swing terbaru.
//  - Maksimal 10 sinyal per hari. Setelah TP tercapai, SL tidak ditampilkan sebagai HIT SL.
//
// ASUMSI YANG HARUS DIKONFIRMASI (ubah di CONFIG bila perlu):
//  - 1 pip emas = 0.10 USD (60 pips = 6.00).  - Timeframe M15, pivot swing 3 candle kiri/kanan.
//  - Leg minimal 150 pips agar fib punya arti.  - Hari dihitung menurut WIB.

export const CONFIG = {
  symbol: 'XAUUSD',
  providerSymbol: 'XAU/USD',
  timeframe: '15M',
  interval: '15min',
  decimals: 2,
  pip: 0.1,
  slPips: 60,
  tpPips: [60, 120, 180],
  entryFib: 0.705,
  zoneFib: [0.7, 0.71],
  secondFib: 0.796,
  k: 3,
  minLegPips: 150,
  maxPerDay: 10,
  expireHours: 72,
  freshCandles: 2, // sinyal baru hanya dibuat jika level tersentuh di 2 candle terakhir
  stage2Hours: 24, // entry kedua (Fib 0.796) hanya ditunggu sampai sekian jam setelah SL pertama
  staleMinutes: 45 // data lebih lama dari ini dianggap pasar tutup / data macet
}

const TERMINAL = ['TP3', 'SL', 'CLOSED', 'EXPIRED']
const TP_TYPES = ['TP1', 'TP2', 'TP3']

export function findSwings(c, k) {
  const out = []
  for (let i = k; i < c.length - k; i++) {
    let isH = true, isL = true
    for (let j = 1; j <= k; j++) {
      if (!(c[i].high > c[i - j].high) || !(c[i].high >= c[i + j].high)) isH = false
      if (!(c[i].low < c[i - j].low) || !(c[i].low <= c[i + j].low)) isL = false
    }
    if (isH) out.push({ index: i, time: c[i].time, price: c[i].high, type: 'high' })
    if (isL) out.push({ index: i, time: c[i].time, price: c[i].low, type: 'low' })
  }
  return out
}

/** Gabungkan swing berurutan yang sejenis (ambil yang paling ekstrem) supaya bergantian high-low-high. */
export function zigzag(swings) {
  const out = []
  for (const s of [...swings].sort((a, b) => a.index - b.index)) {
    const last = out[out.length - 1]
    if (last && last.index === s.index) continue
    if (last && last.type === s.type) {
      if ((s.type === 'high' && s.price >= last.price) || (s.type === 'low' && s.price <= last.price)) out[out.length - 1] = s
      continue
    }
    out.push(s)
  }
  return out
}

/** Leg terbaru dari dua swing terakhir. null jika belum ada leg yang cukup besar. */
export function buildLeg(closed, cfg = CONFIG) {
  const zz = zigzag(findSwings(closed, cfg.k))
  if (zz.length < 2) return null
  const s1 = zz[zz.length - 2], s2 = zz[zz.length - 1]
  const dir = s1.type === 'low' ? 'buy' : 'sell'
  const H = dir === 'buy' ? s2.price : s1.price
  const L = dir === 'buy' ? s1.price : s2.price
  const R = H - L
  if (R < cfg.minLegPips * cfg.pip) return null
  return {
    dir, H, L, R, endIndex: s2.index,
    hTime: dir === 'buy' ? s2.time : s1.time,
    lTime: dir === 'buy' ? s1.time : s2.time,
    key: `${dir}:${s1.time}:${s2.time}`
  }
}

export const fibPrice = (leg, f) => (leg.dir === 'buy' ? leg.H - f * leg.R : leg.L + f * leg.R)
const touches = (leg, c, price) => (leg.dir === 'buy' ? c.low <= price : c.high >= price)
const iso = (sec) => new Date(sec * 1000).toISOString()
const r = (n, cfg) => Number(n.toFixed(cfg.decimals))

/** Hasil evaluasi satu sinyal: event baru (TP1/TP2/TP3/SL/CLOSED/EXPIRED). */
export function evaluateSignal(sig, candles, nowMs, cfg = CONFIG) {
  const have = new Set((sig.events || []).map((e) => e.type))
  if (TERMINAL.some((t) => have.has(t))) return []
  let tpDone = TP_TYPES.filter((t) => have.has(t)).length
  const buy = sig.direction === 'buy'
  const entrySec = Date.parse(sig.entry_time) / 1000
  const tps = [Number(sig.tp1), Number(sig.tp2), Number(sig.tp3)]
  const sl = Number(sig.sl)
  const out = []
  for (const c of candles) {
    if (c.time < entrySec) continue
    const isEntryCandle = c.time === entrySec
    const slHit = buy ? c.low <= sl : c.high >= sl
    // Dalam satu candle, SL didahulukan (konservatif). Di candle entry, SL pasti terjadi SETELAH entry
    // (harga datang dari sisi TP menuju entry lalu ke SL); TP di candle entry tidak dihitung karena urutannya tak pasti.
    if (slHit) {
      out.push({ type: tpDone > 0 ? 'CLOSED' : 'SL', price: sl, event_time: iso(c.time) })
      return out
    }
    if (isEntryCandle) continue
    for (let i = tpDone; i < 3; i++) {
      const hit = buy ? c.high >= tps[i] : c.low <= tps[i]
      if (!hit) break
      out.push({ type: TP_TYPES[i], price: tps[i], event_time: iso(c.time) })
      tpDone = i + 1
    }
    if (tpDone === 3) return out
  }
  if (nowMs - Date.parse(sig.entry_time) > cfg.expireHours * 3600e3) {
    out.push({ type: 'EXPIRED', price: null, event_time: new Date(nowMs).toISOString() })
  }
  return out
}

export const wibDayStartMs = (nowMs) => Math.floor((nowMs + 7 * 3600e3) / 86400e3) * 86400e3 - 7 * 3600e3

function reasonText(leg, stage, entry, cfg) {
  const buy = leg.dir === 'buy'
  const fmt = (n) => n.toFixed(cfg.decimals)
  const z0 = fibPrice(leg, cfg.zoneFib[0]), z1 = fibPrice(leg, cfg.zoneFib[1])
  const legPips = Math.round(leg.R / cfg.pip)
  const head = `${buy ? 'BUY' : 'SELL'} (Fibonacci terbalik): Fib 1 / cut loss di swing ${buy ? 'low' : 'high'} ${fmt(buy ? leg.L : leg.H)}, Fib 0 / TP max di swing ${buy ? 'high' : 'low'} ${fmt(buy ? leg.H : leg.L)} (leg ${legPips} pips).`
  const body = stage === 'fib_0705'
    ? ` Harga retrace ke area entry Fib 0.70 - 0.71 (${fmt(Math.min(z0, z1))} - ${fmt(Math.max(z0, z1))}); entry di Fib 0.705 = ${fmt(entry)}.`
    : ` Entry pertama di Fib 0.705 sudah kena SL dan harga belum menyentuh Fib 0.796, jadi entry kedua di Fib 0.796 = ${fmt(entry)}.`
  return `${head}${body} SL ${cfg.slPips} pips, TP1/TP2/TP3 di ${cfg.tpPips.join('/')} pips (RR 1:1, 1:2, 1:3).`
}

function makeSignal(leg, stage, fib, touchCandle, cfg) {
  const buy = leg.dir === 'buy'
  const entry = r(fibPrice(leg, fib), cfg)
  const sgn = buy ? 1 : -1
  const at = (pips) => r(entry + sgn * pips * cfg.pip, cfg)
  return {
    symbol: cfg.symbol, timeframe: cfg.timeframe, direction: leg.dir, stage, leg_key: leg.key,
    swing_high: r(leg.H, cfg), swing_low: r(leg.L, cfg), swing_high_time: iso(leg.hTime), swing_low_time: iso(leg.lTime),
    fib_level: fib, entry_time: iso(touchCandle.time), entry,
    sl: at(-cfg.slPips), tp1: at(cfg.tpPips[0]), tp2: at(cfg.tpPips[1]), tp3: at(cfg.tpPips[2]),
    sl_pips: cfg.slPips, reason: reasonText(leg, stage, entry, cfg)
  }
}

/**
 * Cari candle pertama (setelah `fromIndex`) yang menyentuh `price`. Level entry selalu terletak di antara
 * Fib 0 dan Fib 1, jadi harga yang menuju Fib 1 pasti melewati level entry lebih dulu.
 */
function findTouch(leg, candles, fromIndex, price, minTime = -Infinity) {
  for (let j = fromIndex; j < candles.length; j++) {
    const c = candles[j]
    if (c.time < minTime) continue
    if (touches(leg, c, price)) return { index: j, candle: c }
  }
  return null
}

const legFromSignal = (s) => {
  const H = Number(s.swing_high), L = Number(s.swing_low)
  return { dir: s.direction, H, L, R: H - L, key: s.leg_key, hTime: Date.parse(s.swing_high_time) / 1000, lTime: Date.parse(s.swing_low_time) / 1000 }
}

/**
 * Satu siklus pemeriksaan. `candles` urut naik, candle terakhir masih berjalan.
 * `signals` = sinyal tersimpan beserta events-nya. Mengembalikan event baru dan sinyal baru.
 */
export function runCycle({ candles, nowMs, signals, cfg = CONFIG }) {
  const result = { newEvents: [], newSignals: [], notes: [] }
  if (candles.length < 40) { result.notes.push('candle kurang'); return result }

  // 1) Hasil sinyal yang sudah ada
  const withEvents = signals.map((s) => ({ ...s, events: [...(s.events || [])] }))
  for (const s of withEvents) {
    const evs = evaluateSignal(s, candles, nowMs, cfg)
    for (const e of evs) { result.newEvents.push({ signal_id: s.id, ...e }); s.events.push(e) }
  }

  // 2) Sinyal baru (hanya jika data segar)
  const last = candles[candles.length - 1]
  if (nowMs - last.time * 1000 > cfg.staleMinutes * 60e3) { result.notes.push('data basi: tidak membuat sinyal baru'); return result }
  const dayStart = wibDayStartMs(nowMs)
  let today = withEvents.filter((s) => Date.parse(s.created_at ?? s.entry_time) >= dayStart).length
  if (today >= cfg.maxPerDay) { result.notes.push('batas sinyal harian tercapai'); return result }

  const fresh = (idx) => idx >= candles.length - 1 - cfg.freshCandles
  const has = (s, type) => s.events.some((e) => e.type === type)

  // 2a) Entry kedua di Fib 0.796: untuk sinyal Fib 0.705 yang kena SL (tanpa TP) dan belum punya sinyal kedua.
  //     Leg dibaca dari catatan sinyal itu sendiri, jadi tidak terpengaruh swing baru yang muncul setelahnya.
  for (const s1 of withEvents.filter((s) => s.stage === 'fib_0705')) {
    if (withEvents.some((x) => x.leg_key === s1.leg_key && x.stage === 'fib_0796')) continue
    if (!has(s1, 'SL') || TP_TYPES.some((t) => has(s1, t))) continue
    const slTime = Date.parse(s1.events.find((e) => e.type === 'SL').event_time) / 1000
    if (nowMs / 1000 - slTime > cfg.stage2Hours * 3600) continue
    const leg = legFromSignal(s1)
    const p796 = fibPrice(leg, cfg.secondFib)
    const entrySec = Date.parse(s1.entry_time) / 1000
    if (candles.some((c) => c.time >= entrySec && c.time <= slTime && touches(leg, c, p796))) {
      result.notes.push('Fib 0.796 sudah tersentuh sebelum SL: lanjut cari swing baru')
      continue
    }
    const t = findTouch(leg, candles, 0, p796, slTime + 1)
    if (t && fresh(t.index)) result.newSignals.push(makeSignal(leg, 'fib_0796', cfg.secondFib, t.candle, cfg))
  }

  // 2b) Entry pertama di Fib 0.705 pada leg terbaru
  const leg = buildLeg(candles.slice(0, -1), cfg)
  if (!leg) result.notes.push('belum ada leg yang cukup besar')
  else if (!withEvents.some((s) => s.leg_key === leg.key && s.stage === 'fib_0705')) {
    const t = findTouch(leg, candles, leg.endIndex + 1, fibPrice(leg, cfg.entryFib))
    if (t) {
      if (fresh(t.index)) result.newSignals.push(makeSignal(leg, 'fib_0705', cfg.entryFib, t.candle, cfg))
      else result.notes.push('level 0.705 sudah lama tersentuh: dilewati agar catatan tidak retroaktif')
    }
  }
  if (today + result.newSignals.length > cfg.maxPerDay) result.newSignals.length = Math.max(0, cfg.maxPerDay - today)
  return result
}

/** Status yang ditampilkan ke pengguna. CLOSED (SL setelah TP) sengaja tidak ditampilkan sebagai HIT SL. */
export function deriveStatus(events) {
  const t = new Set((events || []).map((e) => e.type))
  if (t.has('TP3')) return 'DONE TP 3'
  if (t.has('TP2')) return 'DONE TP 2'
  if (t.has('TP1')) return 'DONE TP 1'
  if (t.has('SL')) return 'HIT SL'
  if (t.has('EXPIRED')) return 'EXPIRED'
  return 'OPEN'
}
