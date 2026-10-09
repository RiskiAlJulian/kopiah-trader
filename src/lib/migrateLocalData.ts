import { supabase } from './supabaseClient'
import type { Trade } from '../types/journal'

// Bentuk data lama di localStorage sebelum migrasi ini: 'BREAKEVEN' dipakai,
// bukan 'BE' seperti skema Supabase saat ini.
type LegacyTrade = Omit<Trade, 'result'> & { result: Trade['result'] | 'BREAKEVEN' }

const ACADEMY_KEY = 'kopiah_academy_progress'
const JOURNAL_KEY = 'kopiah_journal_trades'
const migratedFlag = (userId: string) => `kopiah_migrated_${userId}`

type LocalProgress = Record<string, { done: boolean; score: number; total: number }>

/**
 * Migrasi sekali jalan: data lama di localStorage (dari versi sebelum Supabase)
 * dipindahkan ke akun user yang baru login, lalu dihapus dari localStorage.
 * Jika migrasi gagal, data lokal TIDAK dihapus supaya tidak hilang dan bisa dicoba lagi.
 */
export async function migrateLocalDataToSupabase(userId: string) {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(migratedFlag(userId))) return

  try {
    const rawProgress = localStorage.getItem(ACADEMY_KEY)
    if (rawProgress) {
      const progress: LocalProgress = JSON.parse(rawProgress)
      const rows = Object.entries(progress)
        .filter(([, p]) => p?.done)
        .map(([lessonId, p]) => ({
          user_id: userId, lesson_id: lessonId, is_completed: true,
          quiz_score: p.score, quiz_total: p.total, completed_at: new Date().toISOString()
        }))
      if (rows.length) {
        const { error } = await supabase.from('academy_progress').upsert(rows, { onConflict: 'user_id,lesson_id' })
        if (error) throw error
      }
    }

    const rawTrades = localStorage.getItem(JOURNAL_KEY)
    if (rawTrades) {
      const trades: LegacyTrade[] = JSON.parse(rawTrades)
      if (trades.length) {
        const rows = trades.map((t) => ({
          user_id: userId, pair: t.pair, direction: t.direction, entry_price: t.entry, sl_price: t.stopLoss,
          tp_price: t.takeProfit, lot_size: t.lot, risk_percentage: t.riskPercent,
          result: t.result === 'BREAKEVEN' ? 'BE' : t.result, profit_loss_amount: t.profitLoss,
          trade_date: t.date, timeframe: t.timeframe, strategy: t.strategy, emotion: t.emotion,
          entry_reason: t.reason, mistake: t.mistake, notes: t.notes,
          // Screenshot lama tersimpan sebagai data URL (base64), bukan URL Storage.
          // Tidak diunggah otomatis ke Storage agar migrasi tetap ringan; kolom dikosongkan.
          screenshot_before_url: null, screenshot_after_url: null
        }))
        const { error } = await supabase.from('trading_journals').insert(rows)
        if (error) throw error
      }
    }

    localStorage.removeItem(ACADEMY_KEY)
    localStorage.removeItem(JOURNAL_KEY)
    localStorage.setItem(migratedFlag(userId), '1')
  } catch (e) {
    console.error('Migrasi data lokal ke Supabase gagal, data lokal dipertahankan:', e)
  }
}
