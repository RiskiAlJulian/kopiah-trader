// Mesin analisis teknikal untuk panel Analysis. Semua fungsi murni (tanpa efek samping),
// dihitung dari data candle asli. Bersifat edukasi: hasilnya adalah pembacaan kondisi chart
// dan contoh skenario, BUKAN sinyal trading.
import type { Candle } from '../types/market'

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

  return {
    price, atr: a, lastTime: all[all.length - 1].time,
    bias, structure: { trend: structTrend, lastBreak }, range: rangeInfo,
    supports, resistances, fvgs, confirmation, plan, planReason
  }
}
