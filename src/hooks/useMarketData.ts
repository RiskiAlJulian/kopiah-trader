import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { HAS_KEY, MARKET_REFRESH_INTERVAL, STALE_AFTER_MS } from '../lib/config'
import { marketDataService } from '../services/marketDataService'
import { MissingKeyError, RateLimitError } from '../providers/errors'
import type { DataStatus, Interval, Quote } from '../types/market'

// Retry dengan exponential backoff. Rate limit menunggu lebih lama.
const retry = (n: number, e: unknown) => !(e instanceof MissingKeyError) && n < 4
const retryDelay = (n: number, e: unknown) => Math.min((e instanceof RateLimitError ? 15_000 : 2_000) * 2 ** n, 60_000)
const policy = { enabled: HAS_KEY, staleTime: 30_000, gcTime: 5 * 60_000, refetchInterval: MARKET_REFRESH_INTERVAL, retry, retryDelay }

export function useNow(ms = 15_000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t) }, [ms])
  return now
}

function deriveStatus(data: Quote | undefined, isError: boolean, now: number): DataStatus {
  if (!HAS_KEY) return 'nokey'
  if (!data) return isError ? 'error' : 'loading'
  if (data.isMarketOpen === false) return 'closed'
  return now - data.timestamp > STALE_AFTER_MS ? 'stale' : 'real'
}

// Query key sama => banyak komponen berbagi 1 request (cache TanStack Query).
export function useQuote(id: string) {
  const q = useQuery({ queryKey: ['quote', id], queryFn: () => marketDataService.getQuote(id), ...policy })
  const now = useNow()
  return { q, status: deriveStatus(q.data, q.isError, now) }
}

export function useCandles(id: string, interval: Interval) {
  return useQuery({ queryKey: ['candles', id, interval], queryFn: () => marketDataService.getCandles(id, interval), ...policy })
}
