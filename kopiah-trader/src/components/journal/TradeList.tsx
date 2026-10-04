import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { Trade } from '../../types/journal'
import { fmtPrice } from '../../utils/format'

const resultColor: Record<Trade['result'], string> = {
  WIN: 'text-emerald-700 bg-emerald-50', LOSS: 'text-maroon bg-red-50',
  BE: 'text-charcoal/70 bg-softgray/50', OPEN: 'text-yellow-800 bg-yellow-50'
}

export default function TradeList({ trades, onDelete }: { trades: Trade[]; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState<string | null>(null)
  if (trades.length === 0) return <p className="rounded-2xl border border-softgray bg-cream-card p-5 text-charcoal/70">Belum ada trade.</p>

  return (
    <div className="space-y-2">
      {trades.map((t) => (
        <div key={t.id} className="rounded-2xl border border-softgray bg-cream-card p-4">
          <button className="flex w-full flex-wrap items-center justify-between gap-2 text-left" onClick={() => setOpen(open === t.id ? null : t.id)}>
            <div className="flex items-center gap-2">
              <span className="font-bold">{t.pair}</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${t.direction === 'BUY' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-maroon'}`}>{t.direction}</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${resultColor[t.result]}`}>{t.result}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className={t.profitLoss >= 0 ? 'font-semibold text-emerald-700' : 'font-semibold text-maroon'}>{t.profitLoss >= 0 ? '+' : ''}{t.profitLoss.toFixed(2)}</span>
              <span className="text-charcoal/50">{t.date}</span>
            </div>
          </button>
          {open === t.id && (
            <div className="mt-3 grid gap-3 border-t border-softgray pt-3 text-sm sm:grid-cols-2">
              <div><span className="text-charcoal/50">Entry</span> <b>{fmtPrice(t.entry)}</b></div>
              <div><span className="text-charcoal/50">SL</span> <b>{fmtPrice(t.stopLoss)}</b></div>
              <div><span className="text-charcoal/50">TP</span> <b>{fmtPrice(t.takeProfit)}</b></div>
              <div><span className="text-charcoal/50">Lot</span> <b>{t.lot}</b></div>
              <div><span className="text-charcoal/50">Risk %</span> <b>{t.riskPercent}%</b></div>
              <div><span className="text-charcoal/50">Timeframe</span> <b>{t.timeframe}</b></div>
              <div><span className="text-charcoal/50">Strategy</span> <b>{t.strategy || '-'}</b></div>
              <div><span className="text-charcoal/50">Emotion</span> <b>{t.emotion || '-'}</b></div>
              {t.reason && <div className="sm:col-span-2"><span className="text-charcoal/50">Reason:</span> {t.reason}</div>}
              {t.mistake && <div className="sm:col-span-2"><span className="text-charcoal/50">Mistake:</span> {t.mistake}</div>}
              {t.notes && <div className="sm:col-span-2"><span className="text-charcoal/50">Notes:</span> {t.notes}</div>}
              {(t.beforeImage || t.afterImage) && (
                <div className="flex gap-3 sm:col-span-2">
                  {t.beforeImage && <img src={t.beforeImage} alt="Before entry" className="h-24 rounded-lg border border-softgray object-cover" />}
                  {t.afterImage && <img src={t.afterImage} alt="After exit" className="h-24 rounded-lg border border-softgray object-cover" />}
                </div>
              )}
              <button onClick={() => onDelete(t.id)} className="flex items-center gap-1 text-sm font-semibold text-maroon sm:col-span-2"><Trash2 size={14} />Hapus trade</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
