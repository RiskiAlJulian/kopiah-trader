// Mesin analisis teknikal untuk panel Analysis. Semua fungsi murni (tanpa efek samping),
// dihitung dari data candle asli. Bersifat edukasi: hasilnya adalah pembacaan kondisi chart
// dan contoh skenario, BUKAN sinyal trading.
import type { Candle } from '../types/market'
import { FIBO } from './fiboConfig'

export type Dir = 'bull' | 'bear'
export interface Swing { index: number; time: number; price: number; type: 'high' | 'low' }
export interface Zone {
  source: 'level' | 'fvg'
  /** bull = area yang dicari untuk skenario naik (support/FVG bullish); bear = sebaliknya */
  dir: Dir
  low: number
  high: number
  label: string
  touches?: number
}
export interface Plan {
  dir: Dir
  zone: Zone
  inZone: boolean
  entry: number
  stop: number
  tp1: number
  tp2: number
  rr1: number
  rr2: number
  warnings: string[]
}
export type FiboStatus = 'TUNGGU' | 'PANTAU' | 'SIAP' | 'SINYAL' | 'TELAT' | 'BATAL'
export interface FiboLevel { key: string; label: string; ratio: number; price: number }
export interface Fibo {
  dir: Dir
  status: FiboStatus
  headline: string
  leg: { origin: number; extreme: number; size: number; sizeAtr: number }
  ret: number // posisi harga sekarang (0 = ekstrem, 1 = asal)
  levels: FiboLevel[] // urut dari harga tertinggi ke terendah
  entryZone: { low: number; high: number }
  entry: number
  stop: number
  tp: number
  rr: number
  strength: 'kuat' | 'standar' | 'lemah' | null // hanya saat status SINYAL
  reasons: { ok: boolean; text: string }[]
  warnings: string[]
}
export interface ConfirmItem { label: string; ok: boolean; detail: string }
export interface Analysis {
  price: number
  atr: number
  lastTime: number
  bias: { dir: Dir | null; label: 'Bullish' | 'Bearish' | 'Netral'; strength: 'kuat' | 'sedang' | 'lemah'; reasons: string[] }
  structure: { trend: Dir | 'mixed'; lastBreak: { kind: 'BOS' | 'CHOCH' | 'Break'; dir: Dir; level: number; candlesAgo: number } | null }
  range: { high: number; low: number; position: number; label: 'Premium' | 'Discount' | 'Equilibrium' }
  supports: Zone[]
  resistances: Zone[]
  fvgs: Zone[]
  confirmation: { dir: Dir | null; items: ConfirmItem[]; score: number }
  plan: Plan | null
  planReason: string | null
  fibo: Fibo | null
  fiboReason: string | null
}

export const MIN_CANDLES = 60
const K = 3 // lebar pivot swing: 3 candle di kiri dan kanan

const sma = (v: number[], n: number) => v.slice(-n).reduce((a, b) => a + b, 0) / n

export function atr(c: Candle[], n = 14): number {
  const slice = c.slice(-(n + 1))
  let sum = 0
  for (let i = 1; i < slice.length; i++) {
    const p = slice[i - 1].close
    sum += Math.max(slice[i].high - slice[i].low, Math.abs(slice[i].high - p), Math.abs(slice[i].low - p))
  }
  return sum / Math.max(1, slice.length - 1)
}

export function findSwings(c: Candle[], k = K): Swing[] {
  const out: Swing[] = []
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

/**
 * Struktur: HH+HL = bull, LH+LL = bear, selain itu mixed.
 * `tol` = selisih minimum agar sebuah swing dianggap lebih tinggi/rendah (mencegah noise
 * di pasar sideways dibaca sebagai tren). Biasanya 0.25 x ATR.
 */
export function trendOf(swings: Swing[], tol = 0): Dir | 'mixed' {
  const hs = swings.filter((s) => s.type === 'high').slice(-2)
  const ls = swings.filter((s) => s.type === 'low').slice(-2)
  if (hs.length < 2 || ls.length < 2) return 'mixed'
  if (hs[1].price - hs[0].price > tol && ls[1].price - ls[0].price > tol) return 'bull'
  if (hs[0].price - hs[1].price > tol && ls[0].price - ls[1].price > tol) return 'bear'
  return 'mixed'
}

/** Break swing terbaru (penutupan candle di luar swing high/low). BOS = searah struktur, CHOCH = berlawanan. */
function detectBreak(c: Candle[], swings: Swing[], tol: number, recent = 6): Analysis['structure']['lastBreak'] {
  let best: { j: number; sw: Swing } | null = null
  for (const sw of swings.slice(-10)) {
    for (let j = sw.index + 1; j < c.length; j++) {
      const broke = sw.type === 'high' ? c[j].close > sw.price : c[j].close < sw.price
      if (broke) {
        if (!best || j > best.j) best = { j, sw }
        break
      }
    }
  }
  if (!best || best.j < c.length - recent) return null
  const dir: Dir = best.sw.type === 'high' ? 'bull' : 'bear'
  const prior = trendOf(swings.filter((s) => s.index + K < best!.j), tol)
  const kind = prior === 'mixed' ? 'Break' : prior === dir ? 'BOS' : 'CHOCH'
  return { kind, dir, level: best.sw.price, candlesAgo: c.length - 1 - best.j }
}

function clusterLevels(swings: Swing[], tol: number): { price: number; touches: number }[] {
  const pts = swings.map((s) => s.price).sort((a, b) => a - b)
  const cl: { sum: number; n: number; max: number }[] = []
  for (const p of pts) {
    const last = cl[cl.length - 1]
    if (last && p - last.max <= tol) { last.sum += p; last.n++; last.max = p } else cl.push({ sum: p, n: 1, max: p })
  }
  return cl.map((x) => ({ price: x.sum / x.n, touches: x.n }))
}

function findFVGs(c: Candle[], minGap: number, lookback = 80): Zone[] {
  const out: Zone[] = []
  const start = Math.max(2, c.length - lookback)
  for (let i = start; i < c.length; i++) {
    const a = c[i - 2], z = c[i]
    if (z.low - a.high >= minGap) {
      const bottom = a.high, top = z.low
      if (!c.slice(i + 1).some((x) => x.low <= bottom)) out.push({ source: 'fvg', dir: 'bull', low: bottom, high: top, label: 'FVG Bullish' })
    } else if (a.low - z.high >= minGap) {
      const bottom = z.high, top = a.low
      if (!c.slice(i + 1).some((x) => x.high >= top)) out.push({ source: 'fvg', dir: 'bear', low: bottom, high: top, label: 'FVG Bearish' })
    }
  }
  return out
}

const body = (k: Candle) => Math.abs(k.close - k.open)
const range = (k: Candle) => k.high - k.low
export function isEngulfing(prev: Candle, cur: Candle, dir: Dir): boolean {
  if (body(cur) === 0 || body(prev) === 0) return false
  if (dir === 'bull') return prev.close < prev.open && cur.close > cur.open && cur.close >= prev.open && cur.open <= prev.close
  return prev.close > prev.open && cur.close < cur.open && cur.close <= prev.open && cur.open >= prev.close
}
/** Rejection (pin bar): sumbu panjang di sisi yang ditolak, close di sisi berlawanan. */
export function isRejection(k: Candle, dir: Dir): boolean {
  const r = range(k)
  if (r === 0) return false
  const b = body(k)
  if (dir === 'bull') {
    const lower = Math.min(k.open, k.close) - k.low
    return lower >= 2 * b && lower >= 0.5 * r && (k.close - k.low) / r >= 0.6
  }
  const upper = k.high - Math.max(k.open, k.close)
  return upper >= 2 * b && upper >= 0.5 * r && (k.high - k.close) / r >= 0.6
}

function findLeg(closed: Candle[], swings: Swing[], dir: Dir, a: number): { origin: number; extreme: number } | null {
  const origins = swings.filter((x) => x.type === (dir === 'bull' ? 'low' : 'high')).slice(-6).reverse()
  for (const o of origins) {
    const after = closed.slice(o.index + 1)
    if (after.length < 3) continue
    // titik asal tidak boleh sudah ditembus oleh penutupan candle
    if (dir === 'bull' ? after.some((k) => k.close < o.price) : after.some((k) => k.close > o.price)) continue
    const extreme = dir === 'bull' ? Math.max(...after.map((k) => k.high)) : Math.min(...after.map((k) => k.low))
    if (Math.abs(extreme - o.price) >= FIBO.minLegAtr * a) return { origin: o.price, extreme }
  }
  return null
}

function buildFibo(p: {
  closed: Candle[]; swings: Swing[]; a: number; price: number; dir: Dir; structTrend: Dir | 'mixed'; biasDir: Dir | null; zones: Zone[]; fmt: (n: number) => string
}): { fibo: Fibo | null; reason: string | null } {
  const { closed, swings, a, price, dir, structTrend, biasDir, zones, fmt } = p
  const leg = findLeg(closed, swings, dir, a)
  if (!leg) return { fibo: null, reason: `Belum ada leg ${dir === 'bull' ? 'naik' : 'turun'} yang cukup besar (minimal ${FIBO.minLegAtr}x ATR) untuk ditarik Fibonacci.` }

  const size = Math.abs(leg.extreme - leg.origin)
  const at = (r: number) => (dir === 'bull' ? leg.extreme - r * size : leg.extreme + r * size)
  const ret = dir === 'bull' ? (leg.extreme - price) / size : (price - leg.extreme) / size
  const tolR = (FIBO.touchTolAtr * a) / size

  let status: FiboStatus
  if (ret > FIBO.cl) status = 'BATAL'
  else if (ret > FIBO.entryHigh + tolR) status = 'TELAT'
  else if (ret >= FIBO.entryLow - tolR) status = 'SINYAL'
  else if (ret >= FIBO.prepare) status = 'SIAP'
  else if (ret >= FIBO.discount) status = 'PANTAU'
  else status = 'TUNGGU'

  const levels: FiboLevel[] = [
    { key: 'tp', label: 'TP MAX', ratio: FIBO.tpMax, price: at(FIBO.tpMax) },
    { key: 'discount', label: dir === 'bull' ? 'DISCOUNT' : 'PREMIUM', ratio: FIBO.discount, price: at(FIBO.discount) },
    { key: 'prepare', label: 'PREPARE', ratio: FIBO.prepare, price: at(FIBO.prepare) },
    { key: 'entry', label: 'ENTRY', ratio: FIBO.entryMid, price: at(FIBO.entryMid) },
    { key: 'fm', label: 'FM', ratio: FIBO.fm, price: at(FIBO.fm) },
    { key: 'cl', label: 'CL', ratio: FIBO.cl, price: at(FIBO.cl) }
  ].sort((x, y) => y.price - x.price)

  const zoneA = at(FIBO.entryLow), zoneB = at(FIBO.entryHigh)
  const entryZone = { low: Math.min(zoneA, zoneB), high: Math.max(zoneA, zoneB) }
  const entry = at(FIBO.entryMid), stop = at(FIBO.cl), tp = at(FIBO.tpMax)
  const rr = Math.abs(tp - entry) / Math.abs(entry - stop)

  // Konfluensi tambahan
  const overlap = zones.find((z) => z.dir === dir && z.high >= entryZone.low - 0.25 * a && z.low <= entryZone.high + 0.25 * a)
  const prev = closed[closed.length - 2], cur = closed[closed.length - 1]
  const candleOk = isEngulfing(prev, cur, dir) || isRejection(cur, dir) || isRejection(prev, dir)
  const biasOk = biasDir === dir
  const confluence = [biasOk, !!overlap, candleOk].filter(Boolean).length
  const word = dir === 'bull' ? 'buy' : 'sell'

  const reasons: Fibo['reasons'] = [
    { ok: structTrend === dir, text: structTrend === dir ? `Struktur ${dir === 'bull' ? 'Higher High dan Higher Low' : 'Lower High dan Lower Low'}: arah ${word} sesuai tren.` : `Arah ${word} mengikuti bias; struktur swing belum jelas.` },
    { ok: true, text: `Leg ${dir === 'bull' ? 'naik' : 'turun'}: ${fmt(leg.origin)} → ${fmt(leg.extreme)} (${fmt(size)} poin, ${(size / a).toFixed(1)}x ATR).` },
    { ok: status === 'SINYAL', text: `Harga retrace ${(ret * 100).toFixed(1)}% dari leg. Zona ENTRY ${(FIBO.entryLow * 100).toFixed(0)}–${(FIBO.entryHigh * 100).toFixed(0)}% = ${fmt(entryZone.low)} – ${fmt(entryZone.high)}.` },
    { ok: ret >= FIBO.discount, text: ret >= FIBO.discount ? `Harga sudah melewati 50% leg (area ${dir === 'bull' ? 'discount' : 'premium'}), baik untuk ${word}.` : `Harga belum melewati 50% leg (belum ${dir === 'bull' ? 'discount' : 'premium'}).` },
    { ok: biasOk, text: biasOk ? `Bias SMA (${dir === 'bull' ? 'Bullish' : 'Bearish'}) searah dengan entry.` : 'Bias SMA belum searah (wajar saat pullback dalam), jadi butuh kehati-hatian.' },
    { ok: !!overlap, text: overlap ? `Zona entry berimpit dengan ${overlap.label} (${fmt(overlap.low)} – ${fmt(overlap.high)}).` : 'Tidak ada support/resistance atau FVG yang berimpit dengan zona entry.' },
    { ok: candleOk, text: candleOk ? 'Ada candle konfirmasi (engulfing atau rejection) searah.' : 'Belum ada candle konfirmasi (engulfing/rejection) searah.' },
    { ok: true, text: `Stop di CL 1.0 = ${fmt(stop)}, target TP MAX 0 = ${fmt(tp)}, Reward:Risk 1:${rr.toFixed(1)} dari titik entry ${fmt(entry)}.` }
  ]

  const headline: Record<FiboStatus, string> = {
    TUNGGU: `Belum pullback. Tunggu harga retrace sampai area ${dir === 'bull' ? 'discount' : 'premium'} (≥ 50% leg).`,
    PANTAU: `Harga di area ${dir === 'bull' ? 'discount' : 'premium'}, belum waktunya entry. Pantau terus.`,
    SIAP: 'Siap-siap: harga mendekati zona ENTRY. Tunggu sentuhan zona.',
    SINYAL: `Harga berada di zona ENTRY fibo. Sinyal ${word.toUpperCase()} aktif, cek alasan di bawah.`,
    TELAT: 'Zona ENTRY sudah terlewat. Jangan mengejar harga; tunggu setup baru.',
    BATAL: 'Harga menembus CL (1.0). Setup fibo ini batal.'
  }
  const warnings: string[] = []
  if (Math.abs(entry - stop) > 3 * a) warnings.push('Stop loss (CL) lebih dari 3x ATR dari entry. Risiko per lot besar, kecilkan lot.')
  if (status === 'SINYAL' && confluence === 0) warnings.push('Tidak ada konfluensi tambahan. Pertimbangkan menunggu konfirmasi.')
  if (status === 'SINYAL' && !biasOk) warnings.push('Bias SMA belum searah; ini entry melawan arus jangka pendek.')

  return {
    fibo: {
      dir, status, headline: headline[status], leg: { origin: leg.origin, extreme: leg.extreme, size, sizeAtr: size / a },
      ret, levels, entryZone, entry, stop, tp, rr,
      strength: status === 'SINYAL' ? (confluence >= 2 ? 'kuat' : confluence === 1 ? 'standar' : 'lemah') : null,
      reasons, warnings
    },
    reason: null
  }
}

/**
 * Analisis lengkap. Candle terakhir dari provider dianggap masih berjalan, jadi pembacaan
 * (swing, struktur, pola) memakai candle yang sudah close; harga saat ini = close candle terakhir.
 */
export function analyze(all: Candle[]): Analysis | null {
  if (all.length < MIN_CANDLES + 1) return null
  const closed = all.slice(0, -1)
  const price = all[all.length - 1].close
  const a = atr(closed)
  if (!isFinite(a) || a <= 0) return null

  const closes = closed.map((k) => k.close)
  const fast = sma(closes, 20), slow = sma(closes, 50)
  const maTrend: Dir | 'flat' = price > fast && fast > slow ? 'bull' : price < fast && fast < slow ? 'bear' : 'flat'

  const swings = findSwings(closed)
  const structTrend = trendOf(swings, a * 0.25)
  const lastBreak = detectBreak(closed, swings, a * 0.25)

  // --- Market Bias ---
  const reasons: string[] = []
  reasons.push(
    maTrend === 'bull' ? 'Harga di atas SMA20, dan SMA20 di atas SMA50.'
      : maTrend === 'bear' ? 'Harga di bawah SMA20, dan SMA20 di bawah SMA50.'
        : 'Harga dan SMA20/SMA50 tidak searah (belum ada tren jelas).'
  )
  reasons.push(
    structTrend === 'bull' ? 'Struktur: Higher High dan Higher Low.'
      : structTrend === 'bear' ? 'Struktur: Lower High dan Lower Low.'
        : 'Struktur: swing belum membentuk HH/HL atau LH/LL yang jelas.'
  )
  let dir: Dir | null = null
  let strength: Analysis['bias']['strength'] = 'lemah'
  const m = maTrend === 'flat' ? null : maTrend
  const s = structTrend === 'mixed' ? null : structTrend
  if (m && s && m === s) { dir = m; strength = 'kuat' }
  else if (m && s && m !== s) { dir = null; reasons.push('Indikator dan struktur saling bertentangan, jadi bias dianggap netral.') }
  else if (m || s) { dir = (m ?? s) as Dir; strength = 'sedang' }
  const bias = { dir, label: (dir === 'bull' ? 'Bullish' : dir === 'bear' ? 'Bearish' : 'Netral') as Analysis['bias']['label'], strength: dir ? strength : 'lemah', reasons }

  // --- Premium / Discount (range 50 candle terakhir) ---
  const win = closed.slice(-50)
  const hi = Math.max(...win.map((k) => k.high)), lo = Math.min(...win.map((k) => k.low))
  const pos = hi > lo ? Math.min(1, Math.max(0, (price - lo) / (hi - lo))) : 0.5
  const rangeInfo = { high: hi, low: lo, position: pos, label: (pos > 0.55 ? 'Premium' : pos < 0.45 ? 'Discount' : 'Equilibrium') as Analysis['range']['label'] }

  // --- Area of Interest ---
  const recentSwings = swings.slice(-40)
  const levels = clusterLevels(recentSwings, a * 0.5)
  const half = a * 0.25
  const supports: Zone[] = levels
    .filter((l) => l.price < price - a * 0.1)
    .sort((x, y) => y.price - x.price)
    .slice(0, 3)
    .map((l) => ({ source: 'level', dir: 'bull', low: l.price - half, high: l.price + half, label: `Support (${l.touches}x sentuh)`, touches: l.touches }))
  const resistances: Zone[] = levels
    .filter((l) => l.price > price + a * 0.1)
    .sort((x, y) => x.price - y.price)
    .slice(0, 3)
    .map((l) => ({ source: 'level', dir: 'bear', low: l.price - half, high: l.price + half, label: `Resistance (${l.touches}x sentuh)`, touches: l.touches }))
  const fvgs = findFVGs(closed, a * 0.1)
    .sort((x, y) => Math.abs((x.low + x.high) / 2 - price) - Math.abs((y.low + y.high) / 2 - price))
    .slice(0, 3)

  // --- Konfirmasi + Plan (hanya kalau bias punya arah) ---
  const prev = closed[closed.length - 2], cur = closed[closed.length - 1]
  let confirmation: Analysis['confirmation'] = { dir: null, items: [], score: 0 }
  let plan: Plan | null = null
  let planReason: string | null = null

  if (!dir) {
    planReason = 'Bias masih netral, jadi belum ada skenario. Tunggu arah yang lebih jelas.'
  } else {
    const aligned = [...supports, ...resistances, ...fvgs].filter((z) => z.dir === dir)
    const candidates = aligned
      .filter((z) => (dir === 'bull' ? z.low <= price : z.high >= price))
      .map((z) => ({ z, d: dir === 'bull' ? Math.max(0, price - z.high) : Math.max(0, z.low - price) }))
      .sort((x, y) => x.d - y.d)
    const nearest = candidates[0]
    const near = !!nearest && nearest.d <= a * 0.75

    const hasRej = isRejection(cur, dir) || isRejection(prev, dir)
    const hasEng = isEngulfing(prev, cur, dir)
    const breakOk = !!lastBreak && lastBreak.dir === dir
    const items: ConfirmItem[] = [
      { label: 'Harga dekat Area of Interest', ok: near, detail: nearest ? (nearest.d === 0 ? `Harga di dalam ${nearest.z.label}.` : `Jarak ke ${nearest.z.label}: ${(nearest.d / a).toFixed(1)}x ATR.`) : 'Belum ada area yang searah di dekat harga.' },
      { label: 'Candle konfirmasi', ok: hasRej || hasEng, detail: hasEng ? 'Terbentuk engulfing searah.' : hasRej ? 'Terbentuk rejection (sumbu panjang) searah.' : 'Belum ada engulfing atau rejection di candle terakhir.' },
      { label: 'Struktur mendukung', ok: breakOk, detail: breakOk ? `${lastBreak!.kind} ${lastBreak!.dir === 'bull' ? 'bullish' : 'bearish'} ${lastBreak!.candlesAgo === 0 ? 'di candle terakhir' : `${lastBreak!.candlesAgo} candle lalu`}.` : 'Belum ada BOS/CHOCH searah dalam 6 candle terakhir.' }
    ]
    confirmation = { dir, items, score: items.filter((i) => i.ok).length }

    if (!nearest) {
      planReason = `Belum ada area ${dir === 'bull' ? 'support/FVG bullish di bawah' : 'resistance/FVG bearish di atas'} harga yang bisa dijadikan acuan.`
    } else {
      const z = nearest.z
      const inZone = nearest.d === 0
      const sign = dir === 'bull' ? 1 : -1
      const entry = inZone ? price : dir === 'bull' ? z.high : z.low
      // Stop di luar zona (+0.5 ATR), dan minimal 1 ATR dari entry supaya tidak mudah tersapu noise.
      const stop = dir === 'bull' ? Math.min(z.low - a * 0.5, entry - a) : Math.max(z.high + a * 0.5, entry + a)
      const risk = Math.abs(entry - stop)
      const opp = (dir === 'bull' ? resistances : supports).map((x) => (x.low + x.high) / 2)
        .filter((p) => (p - entry) * sign >= risk) // target harus minimal 1R
        .sort((x, y) => (x - y) * sign)
      const tp1 = opp[0] ?? entry + sign * 2 * risk
      const tp2 = opp[1] ?? entry + sign * 3 * risk
      const warnings: string[] = []
      const rr1 = Math.abs(tp1 - entry) / risk
      if (rr1 < 1.5) warnings.push('Reward:Risk TP1 di bawah 1:1.5, kurang menarik.')
      if (!opp[0]) warnings.push('Tidak ada level lawan yang cukup jauh; target dihitung dari kelipatan risk (2R dan 3R).')
      if (risk > a * 3) warnings.push('Stop loss cukup jauh (lebih dari 3x ATR). Pertimbangkan timeframe lebih besar atau tunggu area yang lebih dekat.')
      plan = { dir, zone: z, inZone, entry, stop, tp1, tp2, rr1, rr2: Math.abs(tp2 - entry) / risk, warnings }
    }
  }

  // --- Sinyal Fibonacci: arah dari struktur (HH/HL atau LH/LL); kalau belum jelas pakai bias ---
  const fiboDir: Dir | null = structTrend !== 'mixed' ? structTrend : dir
  const decimals = price >= 1000 ? 2 : price >= 20 ? 3 : price >= 1 ? 5 : 6
  const fiboRes = fiboDir
    ? buildFibo({ closed, swings, a, price, dir: fiboDir, structTrend, biasDir: dir, zones: [...supports, ...resistances, ...fvgs], fmt: (n) => n.toFixed(decimals) })
    : { fibo: null, reason: 'Arah belum jelas (struktur dan bias belum searah), jadi Fibonacci belum ditarik.' }

  return {
    price, atr: a, lastTime: all[all.length - 1].time,
    bias, structure: { trend: structTrend, lastBreak }, range: rangeInfo,
    supports, resistances, fvgs, confirmation, plan, planReason,
    fibo: fiboRes.fibo, fiboReason: fiboRes.reason
  }
}
