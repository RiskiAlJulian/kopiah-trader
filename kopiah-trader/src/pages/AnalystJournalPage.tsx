import { useMemo, useState } from 'react'
import SignalCard from '../components/analyst/SignalCard'
import { useAnalystSignals } from '../hooks/useAnalystSignals'
import { HAS_SUPABASE } from '../lib/supabaseClient'
import { deriveStatus } from '../types/analyst'

type Filter = 'ALL' | 'OPEN' | 'TP' | 'SL'

export default function AnalystJournalPage() {
  const [limit, setLimit] = useState(50)
  const [filter, setFilter] = useState<Filter>('ALL')
  const q = useAnalystSignals(limit)
  const all = q.data ?? []

  const stats = useMemo(() => {
    const st = all.map((s) => deriveStatus(s.events))
    const n = (x: string) => st.filter((v) => v === x).length
    const tp = n('DONE TP 1') + n('DONE TP 2') + n('DONE TP 3')
    const sl = n('HIT SL')
    return { total: all.length, open: n('OPEN'), tp1: n('DONE TP 1'), tp2: n('DONE TP 2'), tp3: n('DONE TP 3'), tp, sl, winRate: tp + sl ? (tp / (tp + sl)) * 100 : null }
  }, [all])

  const shown = all.filter((s) => {
    const st = deriveStatus(s.events)
    return filter === 'ALL' || (filter === 'OPEN' && st === 'OPEN') || (filter === 'TP' && st.startsWith('DONE')) || (filter === 'SL' && st === 'HIT SL')
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-bold">Jurnal KOPIAH TRADER ANALIS</h1>
      <p className="mt-1 text-sm text-charcoal/70">
        Semua sinyal otomatis dicatat di sini secara permanen. Catatan tidak bisa diubah atau dihapus dari aplikasi, termasuk oleh admin aplikasi. Hasil TP/SL dicatat sebagai riwayat tambahan, bukan dengan menimpa sinyal.
      </p>

      {!HAS_SUPABASE && <p className="mt-4 text-sm text-maroon">Supabase belum terhubung, jurnal belum bisa dimuat.</p>}
      {q.isError && <p className="mt-4 text-sm text-maroon">Jurnal belum bisa dimuat: {(q.error as Error).message}. Pastikan file supabase/analyst-signals.sql sudah dijalankan.</p>}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Total sinyal" value={String(stats.total)} />
        <Stat label="Selesai TP" value={`${stats.tp}`} sub={`TP1 ${stats.tp1} · TP2 ${stats.tp2} · TP3 ${stats.tp3}`} tone="text-emerald-800" />
        <Stat label="HIT SL" value={String(stats.sl)} tone="text-maroon" />
        <Stat label="Win rate" value={stats.winRate === null ? '-' : `${stats.winRate.toFixed(0)}%`} sub={`${stats.open} masih OPEN`} />
      </div>
      <p className="mt-1 text-[11px] text-charcoal/50">Win rate = sinyal yang mencapai minimal TP1 dibagi (yang mencapai TP + yang HIT SL). Sinyal OPEN dan kedaluwarsa tidak dihitung.</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {([['ALL', 'Semua'], ['OPEN', 'OPEN'], ['TP', 'DONE TP'], ['SL', 'HIT SL']] as const).map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === k ? 'bg-maroon text-white' : 'bg-softgray/50 hover:bg-softgray'}`}>{label}</button>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        {q.isPending && HAS_SUPABASE && Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-softgray/50" />)}
        {q.isSuccess && shown.length === 0 && <p className="rounded-xl border border-softgray bg-cream-card p-4 text-sm text-charcoal/70">{all.length === 0 ? 'Belum ada sinyal. Sinyal muncul otomatis saat harga menyentuh area entry Fibonacci.' : 'Tidak ada sinyal untuk filter ini.'}</p>}
        {shown.map((s) => <SignalCard key={s.id} s={s} />)}
      </div>

      {q.isSuccess && all.length >= limit && (
        <button onClick={() => setLimit((l) => l + 50)} className="mt-3 rounded-full bg-softgray/60 px-4 py-2 text-sm font-semibold hover:bg-softgray">Muat lebih banyak</button>
      )}

      <p className="mt-6 text-[11px] text-charcoal/50">
        Hanya untuk edukasi dan bukan saran investasi. Sinyal dibuat otomatis dari rumus (Fibonacci, swing) tanpa jaminan profit. Waktu event adalah waktu candle M15 yang menyentuh level. Jika satu candle menyentuh SL dan TP sekaligus, dihitung SL lebih dulu.
      </p>
    </div>
  )
}

function Stat({ label, value, sub, tone = '' }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-softgray bg-cream-card p-3">
      <div className="text-[11px] text-charcoal/50">{label}</div>
      <div className={`text-xl font-bold ${tone}`}>{value}</div>
      {sub && <div className="text-[10px] text-charcoal/50">{sub}</div>}
    </div>
  )
}
