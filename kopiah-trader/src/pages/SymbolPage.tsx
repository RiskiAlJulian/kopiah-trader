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
        <div className="max-h-[80vh] overflow-y-auto pr-1">
          {SYMBOLS.map((s) => (
            <Link key={s.id} to={`/market/${s.id}`} className={`mb-1 block rounded-xl px-3 py-2 text-sm font-medium ${s.id === symbol ? 'bg-maroon text-white' : 'hover:bg-softgray/50'}`}>{s.id}</Link>
          ))}
        </div>
      </aside>
      <div className="min-w-0 space-y-4">
        <TradingViewSymbolInfo key={`info-${symbol}`} symbolId={symbol} />
        <TradingViewChart key={`chart-${symbol}`} symbolId={symbol} />
        <p className="text-[11px] text-charcoal/50">Mau instrumen lain? Klik nama simbol di dalam chart untuk mencari semua instrumen TradingView. Kotak harga di atas hanya mengikuti instrumen dari daftar Market.</p>
      </div>
      <aside><Analysis id={symbol} /></aside>
    </div>
  )
}
