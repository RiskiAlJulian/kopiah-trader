import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Analysis from '../components/Analysis'
import CandleChart from '../components/CandleChart'
import TradingViewChart from '../components/TradingViewChart'
import PriceBlock from '../components/PriceBlock'
import { SYMBOLS } from '../lib/config'

type ChartSource = 'kopiah' | 'tradingview'

export default function SymbolPage() {
  const { symbol = 'XAUUSD' } = useParams()
  const [source, setSource] = useState<ChartSource>('kopiah')

  return (
    <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)_300px]">
      <aside className="hidden lg:block">
        <div className="mb-2 text-sm font-semibold">Watchlist</div>
        {SYMBOLS.map((s) => (
          <Link key={s.id} to={`/market/${s.id}`} className={`mb-1 block rounded-xl px-3 py-2 text-sm font-medium ${s.id === symbol ? 'bg-maroon text-white' : 'hover:bg-softgray/50'}`}>{s.id}</Link>
        ))}
      </aside>
      <div className="min-w-0 space-y-4">
        <PriceBlock id={symbol} />

        <div className="flex gap-1.5">
          <button onClick={() => setSource('kopiah')}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${source === 'kopiah' ? 'bg-maroon text-white' : 'bg-softgray/50'}`}>
            Chart KOPIAH TRADER
          </button>
          <button onClick={() => setSource('tradingview')}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${source === 'tradingview' ? 'bg-maroon text-white' : 'bg-softgray/50'}`}>
            Chart TradingView (Resmi)
          </button>
        </div>

        {source === 'kopiah' ? <CandleChart key={symbol} id={symbol} /> : <TradingViewChart key={symbol} symbolId={symbol} />}
      </div>
      <aside><Analysis id={symbol} /></aside>
    </div>
  )
}