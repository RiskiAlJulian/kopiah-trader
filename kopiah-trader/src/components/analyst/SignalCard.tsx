import { useState } from 'react'
import { deriveStatus, type AnalystSignal, type SignalStatus } from '../../types/analyst'
import { fmtWIB } from '../../utils/format'

export const STATUS_STYLE: Record<SignalStatus, string> = {
  OPEN: 'bg-amber-50 text-amber-800',
  'DONE TP 1': 'bg-emerald-50 text-emerald-800',
  'DONE TP 2': 'bg-emerald-100 text-emerald-900',
  'DONE TP 3': 'bg-emerald-200 text-emerald-900',
  'HIT SL': 'bg-red-50 text-maroon',
  EXPIRED: 'bg-softgray/60 text-charcoal/70'
}

const f = (n: number) => Number(n).toFixed(2)

export default function SignalCard({ s, compact = false }: { s: AnalystSignal; compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const status = deriveStatus(s.events)
  const buy = s.direction === 'buy'
  const evTime = (t: string) => s.events.find((e) => e.type === t)?.event_time
  const hit = (t: string) => !!evTime(t)

  return (
    <div className="rounded-xl border border-softgray bg-white p-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${buy ? 'bg-emerald-600 text-white' : 'bg-maroon text-white'}`}>{buy ? 'BUY' : 'SELL'}</span>
          <b>{s.symbol}</b>
          <span className="text-charcoal/50">{s.timeframe} · Fib {s.fib_level}</span>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLE[status]}`}>{status}</span>
      </div>
      <p className="mt-1 text-[11px] text-charcoal/50">{fmtWIB(Date.parse(s.entry_time))}{s.stage === 'fib_0796' ? ' · entry kedua (0.796)' : ''}</p>

      <dl className="mt-2 grid grid-cols-5 gap-1 text-center">
        <Cell label="Entry" value={f(s.entry)} />
        <Cell label="SL" value={f(s.sl)} tone="text-maroon" />
        <Cell label="TP1" value={f(s.tp1)} tone="text-emerald-800" done={hit('TP1')} />
        <Cell label="TP2" value={f(s.tp2)} tone="text-emerald-800" done={hit('TP2')} />
        <Cell label="TP3" value={f(s.tp3)} tone="text-emerald-800" done={hit('TP3')} />
      </dl>

      {!compact && (
        <>
          <button type="button" onClick={() => setOpen((o) => !o)} className="mt-2 text-[11px] font-semibold text-maroon">
            {open ? 'Sembunyikan alasan entry' : 'Lihat alasan entry'}
          </button>
          {open && (
            <div className="mt-1 space-y-1 text-[11px] text-charcoal/70">
              <p>{s.reason}</p>
              <ul className="list-disc pl-4">
                {s.events.filter((e) => e.type !== 'CLOSED').sort((a, b) => a.event_time.localeCompare(b.event_time)).map((e) => (
                  <li key={e.type}>{e.type === 'SL' ? 'HIT SL' : e.type === 'EXPIRED' ? 'Kedaluwarsa (72 jam tanpa TP/SL)' : `DONE ${e.type.replace('TP', 'TP ')}`} · {fmtWIB(Date.parse(e.event_time))} (waktu candle)</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Cell({ label, value, tone = '', done = false }: { label: string; value: string; tone?: string; done?: boolean }) {
  return (
    <div className={`rounded-lg px-1 py-1 ${done ? 'bg-emerald-50' : 'bg-cream-card'}`}>
      <dt className="text-[10px] text-charcoal/50">{label}{done ? ' ✓' : ''}</dt>
      <dd className={`font-semibold ${tone}`}>{value}</dd>
    </div>
  )
}
