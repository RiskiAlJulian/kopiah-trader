import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import TradingViewSymbolInfo from './TradingViewSymbolInfo'
import { symbolName } from '../lib/config'

export default function MarketCard({ id, featured }: { id: string; featured?: boolean }) {
  return (
    <div className={`rounded-2xl border p-3 shadow-sm ${featured ? 'border-maroon bg-white sm:col-span-2 lg:col-span-3' : 'border-softgray bg-cream-card'}`}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-bold">{featured && <Star size={16} className="fill-maroon text-maroon" />}{id}</div>
        <Link to={`/market/${id}`} className="text-xs font-semibold text-maroon hover:underline">Lihat Chart →</Link>
      </div>
      <div className="mb-2 text-xs text-charcoal/60">{symbolName(id)}</div>
      <TradingViewSymbolInfo symbolId={id} />
    </div>
  )
}
