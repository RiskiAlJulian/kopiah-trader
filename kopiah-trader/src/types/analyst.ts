export type SignalEventType = 'TP1' | 'TP2' | 'TP3' | 'SL' | 'CLOSED' | 'EXPIRED'
export interface SignalEvent { type: SignalEventType; event_time: string; price: number | null }

export interface AnalystSignal {
  id: string
  created_at: string
  symbol: string
  timeframe: string
  direction: 'buy' | 'sell'
  stage: 'fib_0705' | 'fib_0796'
  swing_high: number
  swing_low: number
  fib_level: number
  entry_time: string
  entry: number
  sl: number
  tp1: number
  tp2: number
  tp3: number
  sl_pips: number
  reason: string
  events: SignalEvent[]
}

export type SignalStatus = 'OPEN' | 'DONE TP 1' | 'DONE TP 2' | 'DONE TP 3' | 'HIT SL' | 'EXPIRED'

/**
 * Status yang ditampilkan. Jika TP sudah tercapai, SL setelahnya (event CLOSED) tidak pernah
 * ditampilkan sebagai HIT SL: status tetap TP tertinggi yang tercapai.
 */
export function deriveStatus(events: { type: SignalEventType }[]): SignalStatus {
  const t = new Set(events.map((e) => e.type))
  if (t.has('TP3')) return 'DONE TP 3'
  if (t.has('TP2')) return 'DONE TP 2'
  if (t.has('TP1')) return 'DONE TP 1'
  if (t.has('SL')) return 'HIT SL'
  if (t.has('EXPIRED')) return 'EXPIRED'
  return 'OPEN'
}
