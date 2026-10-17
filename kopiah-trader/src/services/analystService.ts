import { HAS_SUPABASE, supabase } from '../lib/supabaseClient'
import type { AnalystSignal } from '../types/analyst'

// Jurnal analis bersifat baca-saja untuk aplikasi: penulisan hanya dilakukan server (api/analyst-run.js).
export async function fetchAnalystSignals(limit = 100, symbol?: string, timeframe?: string): Promise<AnalystSignal[]> {
  if (!HAS_SUPABASE) return []
  let q = supabase
    .from('analyst_signals')
    .select('id,created_at,symbol,timeframe,direction,stage,entry_time,entry,sl,tp1,tp2,tp3,sl_pips,reason, events:analyst_signal_events(type,event_time,price)')
    .order('entry_time', { ascending: false })
    .limit(limit)
  if (symbol) q = q.eq('symbol', symbol)
  if (timeframe) q = q.eq('timeframe', timeframe)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []) as AnalystSignal[]
}
