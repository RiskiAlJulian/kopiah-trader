import type { NewsProvider } from '../providers/NewsProvider'
import { FMPProvider } from '../providers/FMPProvider'

// Ganti provider di sini saja kalau nanti pindah (mis. new OtherNewsProvider()).
const provider: NewsProvider = new FMPProvider(import.meta.env.VITE_FMP_API_KEY)

export const newsService = {
  getCalendar: (from: string, to: string) => provider.getCalendar(from, to)
}
