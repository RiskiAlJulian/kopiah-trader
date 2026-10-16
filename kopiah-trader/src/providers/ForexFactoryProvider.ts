import type { EconomicEvent, Impact } from '../types/news'
import type { NewsProvider } from './NewsProvider'
import { ProviderError, RateLimitError } from './errors'

// Panggilan lewat fungsi server /api/calendar (api/calendar.js), yang mengambil feed gratis
// Forex Factory (Fair Economy). Feed hanya memuat minggu berjalan; tanpa nilai actual.
const BASE = '/api/calendar'

const normalizeImpact = (raw: unknown): Impact => {
  const s = String(raw ?? '').toLowerCase()
  if (s.startsWith('high')) return 'HIGH'
  if (s.startsWith('med')) return 'MEDIUM'
  return 'LOW' // termasuk "Holiday"
}
const text = (v: unknown): string | null => {
  const s = String(v ?? '').trim()
  return s ? s : null
}

export class ForexFactoryProvider implements NewsProvider {
  async getCalendar(fromISODate: string, toISODate: string): Promise<EconomicEvent[]> {
    let res: Response
    try {
      res = await fetch(BASE)
    } catch { throw new ProviderError('network') }
    if (res.status === 429) throw new RateLimitError()
    if (res.status === 502) {
      const b = await res.json().catch(() => null)
      if (b?.upstream_status === 429) throw new RateLimitError()
      const up = b?.upstream_status
      throw new ProviderError(`Gagal mengambil kalender${up ? ` (HTTP ${up})` : ''}. ${b?.detail ?? ''}`.trim())
    }
    const data = await res.json().catch(() => null)
    if (!res.ok || !Array.isArray(data)) throw new ProviderError(`HTTP ${res.status}`)

    // Batas hari mengikuti zona waktu perangkat (WIB untuk pengguna di Indonesia).
    const start = new Date(`${fromISODate}T00:00:00`).getTime()
    const end = new Date(`${toISODate}T23:59:59`).getTime()

    return data
      .map((r: any, i: number): EconomicEvent => {
        const country = String(r.country ?? '')
        const currency = country.toLowerCase() === 'all' ? 'GLOBAL' : country.toUpperCase()
        return {
          id: `${r.title}-${r.date}-${country}-${i}`,
          timestamp: Date.parse(r.date), // sudah memuat offset zona waktu
          country: currency,
          currency,
          event: String(r.title ?? 'Event'),
          impact: normalizeImpact(r.impact),
          previous: text(r.previous),
          forecast: text(r.forecast),
          actual: null // feed gratis tidak menyediakan nilai actual
        }
      })
      .filter((e) => isFinite(e.timestamp) && e.timestamp >= start && e.timestamp <= end)
      .sort((a, b) => a.timestamp - b.timestamp)
  }
}
