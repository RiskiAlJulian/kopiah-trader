import { supabase } from '../lib/supabaseClient'
import type { Trade } from '../types/journal'

// Bentuk baris di tabel trading_journals (snake_case, sesuai skema SQL).
interface Row {
  id: string; pair: string; direction: string; entry_price: number; sl_price: number; tp_price: number
  lot_size: number; risk_percentage: number; result: string; profit_loss_amount: number; trade_date: string
  timeframe: string; strategy: string; emotion: string; entry_reason: string; mistake: string; notes: string
  screenshot_before_url: string | null; screenshot_after_url: string | null
}

const toTrade = (r: Row): Trade => ({
  id: r.id, pair: r.pair, direction: r.direction as Trade['direction'],
  entry: Number(r.entry_price), stopLoss: Number(r.sl_price), takeProfit: Number(r.tp_price),
  lot: Number(r.lot_size), riskPercent: Number(r.risk_percentage), result: r.result as Trade['result'],
  profitLoss: Number(r.profit_loss_amount), date: r.trade_date, timeframe: r.timeframe, strategy: r.strategy,
  emotion: r.emotion, reason: r.entry_reason, mistake: r.mistake, notes: r.notes,
  beforeImage: r.screenshot_before_url ?? undefined, afterImage: r.screenshot_after_url ?? undefined
})

const toRow = (userId: string, t: Omit<Trade, 'id'>) => ({
  user_id: userId, pair: t.pair, direction: t.direction, entry_price: t.entry, sl_price: t.stopLoss,
  tp_price: t.takeProfit, lot_size: t.lot, risk_percentage: t.riskPercent, result: t.result,
  profit_loss_amount: t.profitLoss, trade_date: t.date, timeframe: t.timeframe, strategy: t.strategy,
  emotion: t.emotion, entry_reason: t.reason, mistake: t.mistake, notes: t.notes,
  screenshot_before_url: t.beforeImage ?? null, screenshot_after_url: t.afterImage ?? null
})

export async function fetchTrades(userId: string): Promise<Trade[]> {
  const { data, error } = await supabase
    .from('trading_journals').select('*').eq('user_id', userId)
    .order('trade_date', { ascending: false }).order('created_at', { ascending: false })
  if (error) throw error
  return (data as Row[]).map(toTrade)
}

export async function insertTrade(userId: string, t: Omit<Trade, 'id'>): Promise<Trade> {
  const { data, error } = await supabase.from('trading_journals').insert(toRow(userId, t)).select().single()
  if (error) throw error
  return toTrade(data as Row)
}

export async function deleteTrade(id: string): Promise<void> {
  const { error } = await supabase.from('trading_journals').delete().eq('id', id)
  if (error) throw error
}

/** Upload screenshot ke Supabase Storage bucket 'journal-screenshots', kembalikan public URL. */
export async function uploadScreenshot(userId: string, file: File, kind: 'before' | 'after'): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/${kind}-${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('journal-screenshots').upload(path, file, { upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('journal-screenshots').getPublicUrl(path)
  return data.publicUrl
}
