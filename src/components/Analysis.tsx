import { useCandles } from '../hooks/useMarketData'
import { HAS_KEY } from '../lib/config'
const sma = (v: number[], n: number) => v.slice(-n).reduce((a, b) => a + b, 0) / n

export default function Analysis({ id }: { id: string }) {
  const { data } = useCandles(id, '15M')
  let bias = 'Belum tersedia'
  if (data && data.length >= 50) {
    const c = data.map((k) => k.close); const last = c[c.length - 1]
    const a = sma(c, 20), b = sma(c, 50)
    bias = last > a && a > b ? 'Bullish' : last < a && a < b ? 'Bearish' : 'Netral / Sideways'
  }
  return (
    <div className="rounded-2xl border border-softgray bg-cream-card p-5 shadow-sm">
      <div className="text-xs font-semibold text-maroon">KOPIAH TRADER ANALYSIS</div>
      <dl className="mt-3 space-y-2 text-sm">
        <div><dt className="text-charcoal/50">Market Bias (15M, dihitung dari data asli: harga vs SMA20/SMA50)</dt><dd className="font-semibold">{HAS_KEY ? bias : 'Belum tersedia'}</dd></div>
        <div><dt className="text-charcoal/50">Area of Interest</dt><dd className="font-semibold">Belum tersedia</dd></div>
        <div><dt className="text-charcoal/50">Confirmation</dt><dd className="font-semibold">Menunggu</dd></div>
      </dl>
      <p className="mt-4 text-[11px] text-charcoal/50">Hanya untuk edukasi dan bukan saran trading. Tidak ada jaminan profit. Selalu terapkan Risk Management.</p>
    </div>
  )
}
