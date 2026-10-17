import { useQuery } from '@tanstack/react-query'
import { fetchAnalystSignals } from '../services/analystService'

export function useAnalystSignals(limit = 100, symbol?: string, timeframe?: string) {
  return useQuery({
    queryKey: ['analyst-signals', limit, symbol ?? 'all', timeframe ?? 'all'],
    queryFn: () => fetchAnalystSignals(limit, symbol, timeframe),
    refetchInterval: 30_000,
    staleTime: 15_000
  })
}
