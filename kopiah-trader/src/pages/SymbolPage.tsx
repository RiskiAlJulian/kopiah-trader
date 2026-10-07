import { Link, useParams } from 'react-router-dom'
import Analysis from '../components/Analysis'
import TradingViewChart from '../components/TradingViewChart'
import TradingViewSymbolInfo from '../components/TradingViewSymbolInfo'
import { SYMBOLS } from '../lib/config'

export default function SymbolPage() {
  const { symbol = 'XAUUSD' } = useParams()

  return (
    <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)_300px]">
      <aside className="hidden lg:block">
        <div className="mb-2 text-sm font-semibold">Watchlist</div>
        {SYMBOLS.map((s) => (
          <Link key={s.id} to={`/market/${s.id}`} className={`mb-1 block rounded-xl px-3 py-2 text-sm font-medium ${s.id === symbol ? 'bg-maroon text-white' : 'hover:bg-softgray/50'}`}>{s.id}</Link>
        ))}
      </aside>
      <div className="min-w-0 space-y-4">
        <TradingViewSymbolInfo key={`info-${symbol}`} symbolId={symbol} />
        <TradingViewChart key={`chart-${symbol}`} symbolId={symbol} />
      </div>
      <aside><Analysis id={symbol} /></aside>
    </div>
  )
}