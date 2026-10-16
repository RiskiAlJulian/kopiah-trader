import { SYMBOLS } from './config'

/**
 * Nilai (USD) dari pergerakan harga 1.0 untuk 1 lot, memakai spesifikasi kontrak STANDAR.
 * Broker bisa berbeda, jadi hasilnya selalu perlu dicocokkan dengan broker kamu.
 * null = belum didukung (silang tanpa USD, indeks, minyak, crypto: spesifikasi sangat beragam).
 */
export function usdPerPriceUnitPerLot(id: string, price: number): { value: number; assumption: string } | null {
  const def = SYMBOLS.find((s) => s.id === id)
  if (!def) return null
  if (id === 'XAUUSD') return { value: 100, assumption: '1 lot emas = 100 oz' }
  if (id === 'XAGUSD') return { value: 5000, assumption: '1 lot perak = 5.000 oz' }
  if (def.category === 'FOREX' && id.length === 6) {
    const base = id.slice(0, 3), quote = id.slice(3)
    if (quote === 'USD') return { value: 100_000, assumption: '1 lot forex = 100.000 unit' }
    if (base === 'USD' && price > 0) return { value: 100_000 / price, assumption: '1 lot forex = 100.000 unit, dikonversi ke USD dengan harga saat ini' }
  }
  return null
}

export interface LotResult {
  riskAmount: number
  lot: number | null // dibulatkan ke bawah, kelipatan 0.01
  rawLot: number | null
  actualRisk: number | null
  belowMin: boolean
}

export function calcLot(balance: number, riskPct: number, stopDistance: number, valuePerUnit: number | null): LotResult {
  const riskAmount = (balance * riskPct) / 100
  if (!(riskAmount > 0) || !(stopDistance > 0) || !valuePerUnit) return { riskAmount: riskAmount > 0 ? riskAmount : 0, lot: null, rawLot: null, actualRisk: null, belowMin: false }
  const raw = riskAmount / (stopDistance * valuePerUnit)
  const lot = Math.floor(raw * 100 + 1e-9) / 100
  const belowMin = lot < 0.01
  const used = belowMin ? 0.01 : lot
  return { riskAmount, lot: used, rawLot: raw, actualRisk: used * stopDistance * valuePerUnit, belowMin }
}
