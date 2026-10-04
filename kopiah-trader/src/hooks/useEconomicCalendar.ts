import { useQuery } from '@tanstack/react-query'
import { HAS_NEWS_KEY, NEWS_REFRESH_INTERVAL } from '../lib/config'
import { newsService } from '../services/newsService'
import { MissingKeyError, RateLimitError } from '../providers/errors'

const retry = (n: number, e: unknown) => !(e instanceof MissingKeyError) && n < 3
const retryDelay = (n: number, e: unknown) => Math.min((e instanceof RateLimitError ? 15_000 : 2_000) * 2 ** n, 60_000)

export function useEconomicCalendar(fromISODate: string, toISODate: string) {
  return useQuery({
    queryKey: ['economic_calendar', fromISODate, toISODate],
    queryFn: () => newsService.getCalendar(fromISODate, toISODate),
    enabled: HAS_NEWS_KEY,
    staleTime: NEWS_REFRESH_INTERVAL,
    refetchInterval: NEWS_REFRESH_INTERVAL,
    retry, retryDelay
  })
}
