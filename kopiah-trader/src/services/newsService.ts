import type { NewsProvider } from '../providers/NewsProvider'
import { FMPProvider } from '../providers/FMPProvider'

// Ganti provider di sini saja kalau nanti pindah (mis. new OtherNewsProvider()).
const provider: NewsProvider = new FMPProvider()

export const newsService = {
  getCalendar: (from: string, to: string) => provider.getCalendar(from, to)
}
