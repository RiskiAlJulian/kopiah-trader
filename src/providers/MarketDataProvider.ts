import type { Candle, Interval, Quote } from '../types/market'
/** UI tidak boleh bergantung pada provider tertentu. Ganti provider = implementasikan interface ini. */
export interface MarketDataProvider {
  getQuote(symbol: string): Promise<Quote>
  getCandles(symbol: string, interval: Interval, outputSize?: number): Promise<Candle[]>
  getMarketStatus(symbol: string): Promise<{ isOpen: boolean }>
}
