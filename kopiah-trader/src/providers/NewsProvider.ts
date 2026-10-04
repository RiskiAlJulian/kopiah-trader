import type { EconomicEvent } from '../types/news'
/** UI tidak boleh bergantung pada provider tertentu. Ganti provider = implementasikan interface ini. */
export interface NewsProvider {
  getCalendar(fromISODate: string, toISODate: string): Promise<EconomicEvent[]>
}
