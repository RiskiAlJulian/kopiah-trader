import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { deleteTrade as deleteTradeApi, fetchTrades, insertTrade } from '../services/journalService'
import type { Trade } from '../types/journal'

export function useJournal() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const key = ['journal', user?.id] as const

  const query = useQuery({ queryKey: key, queryFn: () => fetchTrades(user!.id), enabled: !!user })
  const trades = query.data ?? []

  const addMutation = useMutation({
    mutationFn: (t: Omit<Trade, 'id'>) => insertTrade(user!.id, t),
    onSuccess: () => qc.invalidateQueries({ queryKey: key })
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTradeApi(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: key })
  })

  const stats = useMemo(() => {
    const closed = trades.filter((t) => t.result !== 'OPEN')
    const wins = closed.filter((t) => t.result === 'WIN')
    const profit = trades.filter((t) => t.profitLoss > 0).reduce((s, t) => s + t.profitLoss, 0)
    const loss = trades.filter((t) => t.profitLoss < 0).reduce((s, t) => s + t.profitLoss, 0)
    const winRate = closed.length ? (wins.length / closed.length) * 100 : 0

    const rrList = trades
      .map((t) => { const risk = Math.abs(t.entry - t.stopLoss); const reward = Math.abs(t.takeProfit - t.entry); return risk > 0 ? reward / risk : null })
      .filter((v): v is number => v !== null)
    const avgRR = rrList.length ? rrList.reduce((a, b) => a + b, 0) / rrList.length : 0

    const chrono = [...closed].sort((a, b) => a.date.localeCompare(b.date))
    let curWin = 0, curLoss = 0, bestWin = 0, bestLoss = 0
    for (const t of chrono) {
      if (t.result === 'WIN') { curWin++; curLoss = 0; bestWin = Math.max(bestWin, curWin) }
      else if (t.result === 'LOSS') { curLoss++; curWin = 0; bestLoss = Math.max(bestLoss, curLoss) }
      else { curWin = 0; curLoss = 0 }
    }
    return { total: trades.length, winRate, profit, loss, avgRR, winningStreak: bestWin, losingStreak: bestLoss }
  }, [trades])

  return {
    trades, stats,
    isLoading: query.isLoading, isError: query.isError, refetch: query.refetch,
    addTrade: addMutation.mutateAsync, isSaving: addMutation.isPending,
    deleteTrade: deleteMutation.mutateAsync, isDeleting: deleteMutation.isPending
  }
}
