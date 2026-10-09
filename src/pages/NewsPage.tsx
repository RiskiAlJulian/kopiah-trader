import { useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useEconomicCalendar } from '../hooks/useEconomicCalendar'
import { HAS_NEWS_KEY } from '../lib/config'
import { RateLimitError } from '../providers/errors'
import type { Impact } from '../types/news'
import { fmtWIB } from '../utils/format'

const IMPACT_STYLE: Record<Impact, string> = {
  HIGH: 'bg-red-50 text-maroon', MEDIUM: 'bg-orange-50 text-orange-800', LOW: 'bg-softgray/50 text-charcoal/70'
}
const toISO = (d: Date) => d.toISOString().slice(0, 10)
const PRESETS = ['Hari Ini', 'Minggu Ini'] as const

function range(preset: (typeof PRESETS)[number]) {
  const now = new Date()
  if (preset === 'Hari Ini') return { from: toISO(now), to: toISO(now) }
  const start = new Date(now); start.setDate(now.getDate() - now.getDay()) // Minggu
  const end = new Date(start); end.setDate(start.getDate() + 6)
  return { from: toISO(start), to: toISO(end) }
}

export default function NewsPage() {
  const [preset, setPreset] = useState<(typeof PRESETS)[number]>('Hari Ini')
  const [currency, setCurrency] = useState('USD')
  const [impact, setImpact] = useState<'ALL' | Impact>('ALL')
  const { from, to } = range(preset)
  const q = useEconomicCalendar(from, to)

  const events = useMemo(() => {
    const list = q.data ?? []
    return list
      .filter((e) => currency === 'ALL' || e.currency?.toUpperCase() === currency)
      .filter((e) => impact === 'ALL' || e.impact === impact)
      .sort((a, b) => a.timestamp - b.timestamp)
  }, [q.data, currency, impact])

  const currencies = useMemo(() => {
    const set = new Set((q.data ?? []).map((e) => e.currency?.toUpperCase()).filter(Boolean))
    return ['ALL', ...Array.from(set).sort()]
  }, [q.data])

  return (
    <div>
      <h1 className="text-2xl font-bold">Economic Calendar</h1>
      <p className="mt-1 text-sm text-charcoal/60">Jam mengikuti zona waktu provider (diasumsikan UTC), dikonversi ke WIB.</p>

      {!HAS_NEWS_KEY ? (
        <p className="mt-4 rounded-2xl border border-softgray bg-cream-card p-5 text-charcoal/70">News data provider belum terhubung. Isi <code>VITE_FMP_API_KEY</code> di file .env untuk mengaktifkan Economic Calendar.</p>
      ) : (
        <>
          <div className="my-4 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p} onClick={() => setPreset(p)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${preset === p ? 'bg-maroon text-white' : 'bg-softgray/50'}`}>{p}</button>
            ))}
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="rounded-full border border-softgray bg-white px-3 py-1.5 text-sm">
              {(currencies.length > 1 ? currencies : ['ALL', 'USD']).map((c) => <option key={c} value={c}>{c === 'ALL' ? 'Semua Currency' : c}</option>)}
            </select>
            <select value={impact} onChange={(e) => setImpact(e.target.value as 'ALL' | Impact)} className="rounded-full border border-softgray bg-white px-3 py-1.5 text-sm">
              <option value="ALL">Semua Impact</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
            </select>
          </div>

          {q.isPending && <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-softgray/50" />)}</div>}

          {q.isError && (
            <div className="rounded-2xl border border-softgray bg-cream-card p-5 text-sm">
              <p>{q.error instanceof RateLimitError
                ? 'Market data sedang mencapai batas request. Data akan diperbarui kembali setelah limit tersedia.'
                : 'News data sementara tidak tersedia.'}</p>
              <button onClick={() => q.refetch()} className="mt-3 inline-flex items-center gap-2 rounded-full bg-maroon px-4 py-2 font-semibold text-white"><RefreshCw size={14} /> COBA LAGI</button>
            </div>
          )}

          {q.isSuccess && (
            events.length === 0 ? (
              <p className="rounded-2xl border border-softgray bg-cream-card p-5 text-charcoal/70">Tidak ada event untuk filter ini.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-softgray bg-cream-card">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-softgray text-left text-xs text-charcoal/50">
                      <th className="p-3">Time (WIB)</th><th className="p-3">Currency</th><th className="p-3">News</th>
                      <th className="p-3">Impact</th><th className="p-3 text-right">Previous</th><th className="p-3 text-right">Forecast</th><th className="p-3 text-right">Actual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((e) => (
                      <tr key={e.id} className="border-b border-softgray/60 last:border-0">
                        <td className="whitespace-nowrap p-3 text-charcoal/70">{fmtWIB(e.timestamp)}</td>
                        <td className="p-3 font-semibold">{e.currency}</td>
                        <td className="p-3">{e.event}</td>
                        <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${IMPACT_STYLE[e.impact]}`}>{e.impact}</span></td>
                        <td className="p-3 text-right text-charcoal/70">{e.previous ?? '-'}</td>
                        <td className="p-3 text-right text-charcoal/70">{e.forecast ?? '-'}</td>
                        <td className="p-3 text-right font-semibold">{e.actual ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}
