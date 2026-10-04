import type { Candle, Interval, Quote } from '../types/market'
import type { MarketDataProvider } from './MarketDataProvider'
import { MissingKeyError, ProviderError, RateLimitError } from './errors'

const BASE = 'https://api.twelvedata.com'
const IV: Record<Interval, string> = { '1M': '1min', '5M': '5min', '15M': '15min', '30M': '30min', '1H': '1h', '4H': '4h', '1D': '1day' }
const num = (v: unknown) => parseFloat(String(v))

export class TwelveDataProvider implements MarketDataProvider {
  constructor(private apiKey?: string) {}

  private async request(path: string, params: Record<string, string>) {
    if (!this.apiKey) throw new MissingKeyError()
    let res: Response
    try {
      res = await fetch(`${BASE}/${path}?${new URLSearchParams({ ...params, apikey: this.apiKey })}`)
    } catch { throw new ProviderError('network') }
    if (res.status === 429) throw new RateLimitError()
    const data = await res.json().catch(() => null)
    // Twelve Data sering mengirim error dengan HTTP 200 + body {status:"error", code}
    if (data?.status === 'error') {
      if (data.code === 429) throw new RateLimitError()
      throw new ProviderError(data.message ?? 'provider error', data.code)
    }
    if (!res.ok || !data) throw new ProviderError(`HTTP ${res.status}`)
    return data
  }

  async getQuote(symbol: string): Promise<Quote> {
    const d = await this.request('quote', { symbol })
    const price = num(d.close)
    if (!isFinite(price)) throw new ProviderError('invalid quote')
    const ts = d.timestamp ? Number(d.timestamp) * 1000 : Date.parse(String(d.datetime).replace(' ', 'T') + 'Z')
    return {
      symbol, price, change: num(d.change), changePercent: num(d.percent_change),
      high: num(d.high), low: num(d.low), timestamp: ts, isMarketOpen: d.is_market_open !== false
    }
  }

  async getCandles(symbol: string, interval: Interval, outputSize = 300): Promise<Candle[]> {
    const d = await this.request('time_series', { symbol, interval: IV[interval], outputsize: String(outputSize), timezone: 'UTC' })
    const rows: any[] = Array.isArray(d.values) ? d.values : []
    const map = new Map<number, Candle>()
    for (const r of rows) {
      const iso = String(r.datetime).replace(' ', 'T')
      const t = Math.floor(Date.parse(iso.length === 10 ? iso : iso + 'Z') / 1000)
      const c = { time: t, open: num(r.open), high: num(r.high), low: num(r.low), close: num(r.close) }
      if (isFinite(t) && isFinite(c.open) && isFinite(c.close)) map.set(t, c)
    }
    return [...map.values()].sort((a, b) => a.time - b.time)
  }

  async getMarketStatus(symbol: string) {
    return { isOpen: (await this.getQuote(symbol)).isMarketOpen }
  }
}
