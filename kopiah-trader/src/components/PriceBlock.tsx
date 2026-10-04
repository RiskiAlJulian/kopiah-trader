import { RefreshCw } from 'lucide-react'
import { useQuote } from '../hooks/useMarketData'
import { RateLimitError } from '../providers/errors'
import { symbolName } from '../lib/config'
import { fmtPrice, fmtSigned, fmtWIB } from '../utils/format'
import StatusBadge from './StatusBadge'

export default function PriceBlock({ id }: { id: string }) {
  const { q, status } = useQuote(id)
  const d = q.data
  const up = (d?.change ?? 0) >= 0
  return (
    <div className="rounded-2xl border border-softgray bg-cream-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xl font-bold tracking-wide">{id}</div>
          <div className="text-sm text-charcoal/60">{symbolName(id)}</div>
        </div>
        <StatusBadge status={status} />
      </div>

      {status === 'nokey' && (
        <p className="mt-4 text-sm text-charcoal/70">API key belum diisi. Buat file <code>.env</code> dan isi <code>VITE_TWELVE_DATA_API_KEY</code>, lalu restart aplikasi. Tidak ada harga palsu yang ditampilkan.</p>
      )}
      {status === 'loading' && <div className="mt-4 h-16 animate-pulse rounded-xl bg-softgray/60" />}
      {status === 'error' && (
        <div className="mt-4 text-sm">
          <p className="text-charcoal/80">{q.error instanceof RateLimitError
            ? 'Market data sedang mencapai batas request. Data akan diperbarui kembali setelah limit tersedia.'
            : 'Market data sementara tidak tersedia.'}</p>
          <button onClick={() => q.refetch()} className="mt-3 inline-flex items-center gap-2 rounded-full bg-maroon px-4 py-2 font-semibold text-white hover:bg-maroon-dark">
            <RefreshCw size={14} /> COBA LAGI
          </button>
        </div>
      )}
      {d && (
        <>
          {status === 'stale' && <p className="mt-3 rounded-lg bg-orange-50 p-2 text-sm text-orange-900">⚠️ STALE DATA — Data pasar belum diperbarui.</p>}
          {q.error instanceof RateLimitError && <p className="mt-3 text-xs text-charcoal/60">Batas request tercapai; menampilkan data terakhir, akan dicoba lagi otomatis.</p>}
          <div className="mt-4 text-4xl font-bold">${fmtPrice(d.price)}</div>
          <div className={`mt-1 font-semibold ${up ? 'text-emerald-700' : 'text-maroon'}`}>
            {fmtSigned(d.change)} ({d.changePercent >= 0 ? '+' : ''}{d.changePercent.toFixed(2)}%)
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><div className="text-charcoal/50">HIGH</div><div className="font-semibold">${fmtPrice(d.high)}</div></div>
            <div><div className="text-charcoal/50">LOW</div><div className="font-semibold">${fmtPrice(d.low)}</div></div>
          </div>
          <div className="mt-4 text-xs text-charcoal/60">Last Updated: {fmtWIB(d.timestamp)}</div>
        </>
      )}
      <p className="mt-3 text-[11px] text-charcoal/50">Price feed may differ slightly from your broker's quote.</p>
    </div>
  )
}
