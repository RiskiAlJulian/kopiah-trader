// Mesin sinyal otomatis KOPIAH TRADER ANALIS.
// Fungsi murni: tidak membaca jaringan atau database. Semua keputusan ditentukan
// oleh candle dan catatan sinyal yang diberikan, sehingga mudah diuji.
//
// ATURAN (dari pemilik aplikasi):
//  - Setiap leg dibentuk dari dua swing besar. Arah leg menentukan sisi: leg naik -> BUY di area Discount,
//    leg turun -> SELL di area Premium. Ujung leg yang berlawanan adalah level pembatalan.
//  - Entry di rasio koreksi 0.705 dari ujung leg (zona 0.70 - 0.71). SL 60 pips, TP1 60, TP2 120, TP3 180 pips.
//  - Jika entry pertama kena SL dan harga belum menyentuh rasio 0.796: entry kedua di 0.796
//    dengan SL/TP yang sama. Jika entry kedua juga kena SL: cari swing terbaru.
//  - Maksimal 10 sinyal per hari. Setelah TP tercapai, SL tidak ditampilkan sebagai HIT SL.
//
// ASUMSI YANG HARUS DIKONFIRMASI (ubah di CONFIG bila perlu):
//  - 1 pip emas = 0.10 USD (60 pips = 6.00).  - Timeframe M15.
//  - Swing = ZigZag dengan deviasi 150 pips (leg lebih kecil diabaikan).  - Hari dihitung menurut WIB.

export const CONFIG = {
  symbol: 'XAUUSD',
  providerSymbol: 'XAU/USD',
  timeframe: '15M',
  interval: '15min',
  decimals: 2,
  pip: 0.1,
  slPips: 60,
  tpPips: [60, 120, 180],
  entryRatio: 0.705,
  zoneRatio: [0.7, 0.71],
  secondRatio: 0.796,
  minLegPips: 150, // juga dipakai sebagai deviasi ZigZag
  maxPerDay: 10,
  expireHours: 72,
  freshCandles: 2, // sinyal baru hanya dibuat jika level tersentuh di 2 candle terakhir
  stage2Hours: 24, // entry kedua (rasio 0.796) hanya ditunggu sampai sekian jam setelah SL pertama
  staleMinutes: 45 // data lebih lama dari ini dianggap pasar tutup / data macet
}

/**
 * Pengaturan per timeframe. `runEvery` (menit) mengatur seberapa sering data timeframe itu diambil, supaya
 * total permintaan ke Twelve Data tetap di bawah kuota gratis (800/hari): sekitar 460 per hari untuk kelimanya.
 * `expireHours` = batas menunggu TP/SL sebelum sinyal ditandai EXPIRED; harus lebih pendek dari rentang
 * data yang diambil (500 candle) agar hasil selalu bisa dievaluasi.
 */
export const TIMEFRAMES = {
  '5M': { interval: '5min', minutes: 5, runEvery: 5, expireHours: 24 },
  '15M': { interval: '15min', minutes: 15, runEvery: 15, expireHours: 72 },
  '1H': { interval: '1h', minutes: 60, runEvery: 30, expireHours: 168 },
  '4H': { interval: '4h', minutes: 240, runEvery: 60, expireHours: 504 },
  '1D': { interval: '1day', minutes: 1440, runEvery: 240, expireHours: 1440 }
}

export function configFor(tf) {
  const t = TIMEFRAMES[tf]
  if (!t) throw new Error(`timeframe tidak dikenal: ${tf}`)
  return { ...CONFIG, timeframe: tf, interval: t.interval, expireHours: t.expireHours, staleMinutes: Math.max(45, t.minutes * 3) }
}

/** Cron berjalan tiap 5 menit; tiap timeframe hanya diproses pada slot kelipatan `runEvery`. */
export const shouldRun = (tf, nowMs) => Math.floor(nowMs / 300000) % (TIMEFRAMES[tf].runEvery / 5) === 0

const TERMINAL = ['TP3', 'SL', 'CLOSED', 'EXPIRED']
const TP_TYPES = ['TP1', 'TP2', 'TP3']

/**
 * ZigZag berbasis deviasi: sebuah pivot baru dianggap sah hanya setelah harga berbalik minimal `dev`
 * dari titik ekstrem. Gelombang kecil (noise) di dalam pullback otomatis diabaikan, jadi leg yang dipilih
 * adalah swing yang memang besar, bukan pivot mikro 3 candle.
 * Mengembalikan pivot yang sudah terkonfirmasi dan ekstrem berjalan (`ext`) setelah pivot terakhir.
 */
export function zigzagDev(c, dev) {
  const pivots = []
  let dir = 0, hi = 0, lo = 0
  const P = (type, i) => ({ index: i, time: c[i].time, price: type === 'high' ? c[i].high : c[i].low, type })
  for (let i = 0; i < c.length; i++) {
    if (dir === 0) {
      if (c[i].high > c[hi].high) hi = i
      if (c[i].low < c[lo].low) lo = i
      if (c[hi].high - c[lo].low >= dev) {
        if (hi > lo) { pivots.push(P('low', lo)); dir = 1 } else { pivots.push(P('high', hi)); dir = -1 }
      }
    } else if (dir === 1) {
      if (c[i].high >= c[hi].high) hi = i
      else if (c[hi].high - c[i].low >= dev) { pivots.push(P('high', hi)); dir = -1; lo = i }
    } else {
      if (c[i].low <= c[lo].low) lo = i
      else if (c[i].high - c[lo].low >= dev) { pivots.push(P('low', lo)); dir = 1; hi = i }
    }
  }
  const ext = dir === 1 ? P('high', hi) : dir === -1 ? P('low', lo) : null
  return { pivots, ext }
}

/**
 * Leg kandidat, dari yang terbaru: (a) leg berjalan = pivot terakhir menuju ekstrem berjalan,
 * (b) leg terakhir yang sudah selesai. Keduanya harus minimal `minLegPips`.
 */
export function buildLegs(closed, cfg = CONFIG) {
  const dev = cfg.minLegPips * cfg.pip
  const { pivots, ext } = zigzagDev(closed, dev)
  const mk = (s, e) => {
    const dir = s.type === 'low' ? 'buy' : 'sell'
    const H = dir === 'buy' ? e.price : s.price
    const L = dir === 'buy' ? s.price : e.price
    const R = H - L
    if (R < dev) return null
    return { dir, H, L, R, endIndex: e.index, hTime: dir === 'buy' ? e.time : s.time, lTime: dir === 'buy' ? s.time : e.time, key: `${cfg.timeframe}:${dir}:${s.time}:${e.time}` }
  }
  const legs = []
  if (pivots.length >= 1 && ext) legs.push(mk(pivots[pivots.length - 1], ext))
  if (pivots.length >= 2) legs.push(mk(pivots[pivots.length - 2], pivots[pivots.length - 1]))
  return legs.filter(Boolean)
}

export const levelPrice = (leg, f) => (leg.dir === 'buy' ? leg.H - f * leg.R : leg.L + f * leg.R)
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

/** FVG searah yang belum terisi dan menaungi harga entry (dihitung dari candle, bukan diasumsikan). */
function fvgAtEntry(leg, candles, touchIdx, entry, cfg) {
  const startTime = Math.min(leg.hTime, leg.lTime)
  const minGap = cfg.pip * 3
  for (let i = 2; i < touchIdx; i++) {
    if (candles[i].time < startTime) continue
    const a = candles[i - 2], z = candles[i]
    if (leg.dir === 'buy' && z.low - a.high >= minGap) {
      const bottom = a.high, top = z.low
      if (entry >= bottom && entry <= top && !candles.slice(i + 1, touchIdx).some((x) => x.low <= bottom)) return { label: 'FVG bullish', bottom, top }
    }
    if (leg.dir === 'sell' && a.low - z.high >= minGap) {
      const bottom = z.high, top = a.low
      if (entry >= bottom && entry <= top && !candles.slice(i + 1, touchIdx).some((x) => x.high >= top)) return { label: 'FVG bearish', bottom, top }
    }
  }
  return null
}

function reasonText(leg, stage, entry, fvg, cfg) {
  const buy = leg.dir === 'buy'
  const fmt = (n) => n.toFixed(cfg.decimals)
  const area = buy ? 'Discount' : 'Premium'
  const legPips = Math.round(leg.R / cfg.pip)
  const move = buy
    ? `Harga naik dari swing low ${fmt(leg.L)} (support) ke swing high ${fmt(leg.H)} (resistance) sepanjang ${legPips} pips, lalu terkoreksi ke area ${area} dalam.`
    : `Harga turun dari swing high ${fmt(leg.H)} (resistance) ke swing low ${fmt(leg.L)} (support) sepanjang ${legPips} pips, lalu terkoreksi naik ke area ${area} dalam.`
  const body = stage === 'entry_1'
    ? ` Entry ${buy ? 'BUY' : 'SELL'} di ${fmt(entry)}.`
    : ` Entry pertama di area ${area} sudah kena SL dan harga belum masuk ke area ${area} yang lebih dalam, jadi entry kedua ${buy ? 'BUY' : 'SELL'} di ${fmt(entry)}.`
  const conf = fvg ? ` Konfluensi: ${fvg.label} ${fmt(fvg.bottom)} - ${fmt(fvg.top)} belum terisi dan menaungi area entry.` : ''
  return `${buy ? 'BUY' : 'SELL'} dari area ${area} (${cfg.timeframe}). ${move.trim()}${body}${conf} SL ${cfg.slPips} pips, TP1/TP2/TP3 di ${cfg.tpPips.join('/')} pips (RR 1:1, 1:2, 1:3).`
}

function makeSignal(leg, stage, ratio, touch, candles, cfg) {
  const buy = leg.dir === 'buy'
  const entry = r(levelPrice(leg, ratio), cfg)
  const sgn = buy ? 1 : -1
  const at = (pips) => r(entry + sgn * pips * cfg.pip, cfg)
  return {
    symbol: cfg.symbol, timeframe: cfg.timeframe, direction: leg.dir, stage, leg_key: leg.key,
    swing_high: r(leg.H, cfg), swing_low: r(leg.L, cfg), swing_high_time: iso(leg.hTime), swing_low_time: iso(leg.lTime),
    level_ratio: ratio, entry_time: iso(touch.candle.time), entry,
    sl: at(-cfg.slPips), tp1: at(cfg.tpPips[0]), tp2: at(cfg.tpPips[1]), tp3: at(cfg.tpPips[2]),
    sl_pips: cfg.slPips, reason: reasonText(leg, stage, entry, fvgAtEntry(leg, candles, touch.index, entry, cfg), cfg)
  }
}

/**
 * Cari candle pertama (setelah `fromIndex`) yang menyentuh `price`. Level entry selalu terletak di antara
 * ujung leg dan level pembatalan, jadi harga yang menuju level pembatalan pasti melewati level entry lebih dulu.
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

  // 2a) Entry kedua (rasio 0.796): untuk sinyal entry pertama yang kena SL (tanpa TP) dan belum punya sinyal kedua.
  //     Leg dibaca dari catatan sinyal itu sendiri, jadi tidak terpengaruh swing baru yang muncul setelahnya.
  for (const s1 of withEvents.filter((s) => s.stage === 'entry_1')) {
    if (withEvents.some((x) => x.leg_key === s1.leg_key && x.stage === 'entry_2')) continue
    if (!has(s1, 'SL') || TP_TYPES.some((t) => has(s1, t))) continue
    const slTime = Date.parse(s1.events.find((e) => e.type === 'SL').event_time) / 1000
    if (nowMs / 1000 - slTime > cfg.stage2Hours * 3600) continue
    const leg = legFromSignal(s1)
    const p796 = levelPrice(leg, cfg.secondRatio)
    const entrySec = Date.parse(s1.entry_time) / 1000
    if (candles.some((c) => c.time >= entrySec && c.time <= slTime && touches(leg, c, p796))) {
      result.notes.push('level entry kedua sudah tersentuh sebelum SL: lanjut cari swing baru')
      continue
    }
    const t = findTouch(leg, candles, 0, p796, slTime + 1)
    if (t && fresh(t.index)) result.newSignals.push(makeSignal(leg, 'entry_2', cfg.secondRatio, t, candles, cfg))
  }

  // 2b) Entry pertama (rasio 0.705) pada leg kandidat (leg berjalan dan leg terakhir yang selesai)
  const legs = buildLegs(candles.slice(0, -1), cfg)
  if (legs.length === 0) result.notes.push('belum ada leg yang cukup besar')
  for (const leg of legs) {
    if (withEvents.some((s) => s.leg_key === leg.key && s.stage === 'entry_1')) continue
    if (result.newSignals.some((s) => s.leg_key === leg.key)) continue
    const t = findTouch(leg, candles, leg.endIndex + 1, levelPrice(leg, cfg.entryRatio))
    if (!t) continue
    if (fresh(t.index)) result.newSignals.push(makeSignal(leg, 'entry_1', cfg.entryRatio, t, candles, cfg))
    else result.notes.push('level entry sudah lama tersentuh: dilewati agar catatan tidak retroaktif')
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
