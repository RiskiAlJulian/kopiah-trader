import type { EconomicEvent, Impact } from '../types/news'
import type { NewsProvider } from './NewsProvider'
import { MissingKeyError, ProviderError, RateLimitError } from './errors'

// FMP memindahkan endpoint lama (/api/v3/economic_calendar, sudah deprecated oleh FMP)
// ke endpoint "stable" ini. Kalau FMP mengganti lagi di masa depan, cukup ubah baris ini.
const BASE = 'https://financialmodelingprep.com/stable/economic-calendar'

const normalizeImpact = (raw: unknown): Impact => {
  const s = String(raw ?? '').toLowerCase()
  if (s.startsWith('high')) return 'HIGH'
  if (s.startsWith('med')) return 'MEDIUM'
  return 'LOW'
}
const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return isFinite(n) ? n : null
}

export class FMPProvider implements NewsProvider {
  constructor(private apiKey?: string) {}

  async getCalendar(fromISODate: string, toISODate: string): Promise<EconomicEvent[]> {
    if (!this.apiKey) throw new MissingKeyError()
    let res: Response
    try {
      res = await fetch(`${BASE}?${new URLSearchParams({ from: fromISODate, to: toISODate, apikey: this.apiKey })}`)
    } catch { throw new ProviderError('network') }
    if (res.status === 429) throw new RateLimitError()
    if (res.status === 401 || res.status === 403) throw new ProviderError('API key tidak valid atau endpoint ini butuh plan berbayar di FMP.')
    const data = await res.json().catch(() => null)
    // FMP mengembalikan error dalam beberapa bentuk berbeda tergantung endpoint/versi.
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const msg = String((data as any)['Error Message'] ?? (data as any).error ?? (data as any).message ?? '')
      if (msg) {
        if (/limit/i.test(msg)) throw new RateLimitError()
        throw new ProviderError(msg)
      }
    }
    if (!res.ok || !Array.isArray(data)) throw new ProviderError(`HTTP ${res.status}`)

    return data.map((r: any, i: number): EconomicEvent => {
      const iso = String(r.date).replace(' ', 'T') + 'Z' // FMP: UTC
      return {
        id: `${r.event}-${r.date}-${i}`,
        timestamp: Date.parse(iso),
        country: r.country ?? '',
        currency: r.currency ?? r.country ?? '',
        event: r.event ?? 'Event',
        impact: normalizeImpact(r.impact),
        previous: num(r.previous), forecast: num(r.estimate), actual: num(r.actual)
      }
    }).filter((e) => isFinite(e.timestamp))
  }
}
