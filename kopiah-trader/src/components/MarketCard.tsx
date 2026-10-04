import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { useQuote } from '../hooks/useMarketData'
import { symbolName } from '../lib/config'
import { fmtPrice, fmtSigned } from '../utils/format'
import StatusBadge from './StatusBadge'

export default function MarketCard({ id, featured }: { id: string; featured?: boolean }) {
  const { q, status } = useQuote(id)
  const d = q.data
  return (
    <Link to={`/market/${id}`} className={`block rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${featured ? 'border-maroon bg-white sm:col-span-2 lg:col-span-3' : 'border-softgray bg-cream-card'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-bold">{featured && <Star size={16} className="fill-maroon text-maroon" />}{id}</div>
        <StatusBadge status={status} />
      </div>
      <div className="text-xs text-charcoal/60">{symbolName(id)}</div>
      {d ? (
        <div className="mt-3 flex items-baseline gap-3">
          <span className={`${featured ? 'text-3xl' : 'text-xl'} font-bold`}>{fmtPrice(d.price)}</span>
          <span className={`text-sm font-semibold ${d.change >= 0 ? 'text-emerald-700' : 'text-maroon'}`}>{fmtSigned(d.change)} ({d.changePercent.toFixed(2)}%)</span>
        </div>
      ) : (
        <div className="mt-3 text-sm text-charcoal/60">{status === 'loading' ? <div className="h-7 w-32 animate-pulse rounded bg-softgray/60" /> : 'Market data belum tersedia.'}</div>
      )}
    </Link>
  )
}
