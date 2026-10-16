import type { NewsProvider } from '../providers/NewsProvider'
import { ForexFactoryProvider } from '../providers/ForexFactoryProvider'

// Ganti provider di sini saja kalau nanti pindah (mis. new OtherNewsProvider()).
const provider: NewsProvider = new ForexFactoryProvider()

export const newsService = {
  getCalendar: (from: string, to: string) => provider.getCalendar(from, to)
}
