import { providerSymbol } from '../lib/config'
import type { MarketDataProvider } from '../providers/MarketDataProvider'
import { TwelveDataProvider } from '../providers/TwelveDataProvider'
import type { Interval } from '../types/market'

// Ganti provider di sini saja (mis. new OtherProvider()).
const provider: MarketDataProvider = new TwelveDataProvider(import.meta.env.VITE_TWELVE_DATA_API_KEY)

export const marketDataService = {
  getQuote: (id: string) => provider.getQuote(providerSymbol(id)).then((q) => ({ ...q, symbol: id })),
  getCandles: (id: string, iv: Interval) => provider.getCandles(providerSymbol(id), iv),
  getMarketStatus: (id: string) => provider.getMarketStatus(providerSymbol(id))
}
