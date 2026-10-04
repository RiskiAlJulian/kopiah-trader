import { useState } from 'react'
import MarketCard from '../components/MarketCard'
import { SYMBOLS } from '../lib/config'
const CATS = ['GOLD', 'FOREX', 'CRYPTO', 'INDEX'] as const

export default function MarketPage() {
  const [cat, setCat] = useState<(typeof CATS)[number] | 'ALL'>('ALL')
  const list = SYMBOLS.filter((s) => cat === 'ALL' || s.category === cat)
  return (
    <div>
      <h1 className="text-2xl font-bold">Market</h1>
      <div className="my-4 flex flex-wrap gap-2">
        {(['ALL', ...CATS] as const).map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${cat === c ? 'bg-maroon text-white' : 'bg-softgray/50'}`}>{c}</button>
        ))}
      </div>
      {list.length === 0 && <p className="text-charcoal/60">Market data belum tersedia untuk kategori ini.</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((s) => <MarketCard key={s.id} id={s.id} featured={s.id === 'XAUUSD'} />)}
      </div>
    </div>
  )
}
