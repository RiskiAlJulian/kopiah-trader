import type { DataStatus } from '../types/market'
const MAP: Record<DataStatus, [string, string]> = {
  real: ['🟢 REAL MARKET DATA', 'text-emerald-800 bg-emerald-50'],
  closed: ['🟢 REAL MARKET DATA · MARKET TUTUP', 'text-emerald-800 bg-emerald-50'],
  stale: ['🟠 STALE DATA', 'text-orange-800 bg-orange-50'],
  error: ['🔴 DATA UNAVAILABLE', 'text-maroon bg-red-50'],
  loading: ['⏳ MEMUAT', 'text-charcoal/60 bg-softgray/50'],
  nokey: ['🟡 API BELUM DIKONFIGURASI', 'text-yellow-800 bg-yellow-50']
}
export default function StatusBadge({ status }: { status: DataStatus }) {
  const [label, cls] = MAP[status]
  return <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${cls}`}>{label}</span>
}
