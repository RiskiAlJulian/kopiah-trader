import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import MarketCard from '../components/MarketCard'
import { CATEGORY_LABEL, SYMBOLS, type Category } from '../lib/config'

const CATS: Category[] = ['GOLD', 'FOREX', 'CRYPTO', 'KOMODITAS', 'INDEX']

export default function MarketPage() {
  const [cat, setCat] = useState<Category | 'ALL'>('ALL')
  const [query, setQuery] = useState('')

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SYMBOLS.filter(
      (s) => (cat === 'ALL' || s.category === cat) && (!q || s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
    )
  }, [cat, query])

  return (
    <div>
      <h1 className="text-2xl font-bold">Market</h1>

      <div className="relative mt-3">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari instrumen, mis. EURJPY, Bitcoin, Nasdaq…"
          className="w-full rounded-full border border-softgray bg-white py-2.5 pl-9 pr-4 text-sm"
        />
      </div>

      <div className="my-3 flex flex-wrap gap-2">
        {(['ALL', ...CATS] as const).map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${cat === c ? 'bg-maroon text-white' : 'bg-softgray/50'}`}>
            {c === 'ALL' ? 'ALL' : CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      <p className="mb-3 text-xs text-charcoal/50">{list.length} instrumen</p>

      {list.length === 0 && (
        <p className="rounded-2xl border border-softgray bg-cream-card p-5 text-sm text-charcoal/70">
          Tidak ada instrumen yang cocok. Untuk instrumen lain apa pun, buka chart mana saja lalu gunakan pencarian simbol di dalam chart TradingView.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((s) => <MarketCard key={s.id} id={s.id} featured={s.id === 'XAUUSD'} />)}
      </div>
    </div>
  )
}
