import type { useJournal } from '../../hooks/useJournal'
type Stats = ReturnType<typeof useJournal>['stats']

const Card = ({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) => (
  <div className="rounded-2xl border border-softgray bg-cream-card p-4">
    <div className="text-xs text-charcoal/50">{label}</div>
    <div className={`mt-1 text-xl font-bold ${tone === 'up' ? 'text-emerald-700' : tone === 'down' ? 'text-maroon' : ''}`}>{value}</div>
  </div>
)

export default function StatsCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <Card label="Total Trades" value={String(stats.total)} />
      <Card label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} />
      <Card label="Profit" value={`$${stats.profit.toFixed(2)}`} tone="up" />
      <Card label="Loss" value={`$${stats.loss.toFixed(2)}`} tone="down" />
      <Card label="Average RR" value={stats.avgRR ? `1 : ${stats.avgRR.toFixed(2)}` : '-'} />
      <Card label="Streak (Win/Loss)" value={`${stats.winningStreak}W / ${stats.losingStreak}L`} />
    </div>
  )
}
