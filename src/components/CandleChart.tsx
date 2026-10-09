import { useEffect, useRef, useState } from 'react'
import { createChart, CrosshairMode, type IChartApi, type ISeriesApi, type UTCTimestamp } from 'lightweight-charts'
import { RefreshCw } from 'lucide-react'
import { useCandles } from '../hooks/useMarketData'
import { DEFAULT_INTERVAL, HAS_KEY } from '../lib/config'
import { RateLimitError } from '../providers/errors'
import { INTERVALS, type Candle, type Interval } from '../types/market'
import { fmtPrice, fmtWIBShort, tickWIB } from '../utils/format'

export default function CandleChart({ id }: { id: string }) {
  const [tf, setTf] = useState<Interval>(DEFAULT_INTERVAL)
  const q = useCandles(id, tf)
  const box = useRef<HTMLDivElement>(null)
  const chart = useRef<IChartApi>()
  const series = useRef<ISeriesApi<'Candlestick'>>()
  const [hover, setHover] = useState<Candle | null>(null)

  useEffect(() => {
    if (!box.current) return
    const c = createChart(box.current, {
      autoSize: true,
      layout: { background: { color: '#F8F5F1' }, textColor: '#2B2B2B' },
      grid: { vertLines: { color: '#E7E1D9' }, horzLines: { color: '#E7E1D9' } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#DAD4CC' },
      timeScale: { borderColor: '#DAD4CC', timeVisible: true, tickMarkFormatter: (t: number, type: number) => tickWIB(t, type >= 3) },
      localization: { timeFormatter: (t: number) => fmtWIBShort(t) }
    })
    const s = c.addCandlestickSeries({
      upColor: '#2B2B2B', borderUpColor: '#2B2B2B', wickUpColor: '#2B2B2B',
      downColor: '#8B1A1A', borderDownColor: '#8B1A1A', wickDownColor: '#8B1A1A'
    })
    c.subscribeCrosshairMove((p) => {
      const d = p.seriesData.get(s) as any
      setHover(d && p.time ? { time: p.time as number, open: d.open, high: d.high, low: d.low, close: d.close } : null)
    })
    chart.current = c; series.current = s
    return () => c.remove()
  }, [])

  useEffect(() => {
    if (!series.current) return
    if (!q.data) { series.current.setData([]); return }
    series.current.setData(q.data.map((k) => ({ ...k, time: k.time as UTCTimestamp })))
  }, [q.data])
  useEffect(() => { if (q.data) chart.current?.timeScale().fitContent() }, [tf, q.isSuccess]) // eslint-disable-line

  const last = q.data?.[q.data.length - 1]
  const shown = hover ?? last
  return (
    <div className="rounded-2xl border border-softgray bg-cream-card p-3 shadow-sm">
      <div className="mb-2 flex flex-wrap gap-1.5">
        {INTERVALS.map((i) => (
          <button key={i} onClick={() => setTf(i)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${tf === i ? 'bg-maroon text-white' : 'bg-softgray/50 text-charcoal hover:bg-softgray'}`}>{i}</button>
        ))}
      </div>
      <div className="mb-2 min-h-[20px] text-xs text-charcoal/70">
        {shown && <>Time {fmtWIBShort(shown.time)} · O {fmtPrice(shown.open)} · H {fmtPrice(shown.high)} · L {fmtPrice(shown.low)} · C {fmtPrice(shown.close)}</>}
      </div>
      <div className="relative h-[360px] w-full md:h-[520px]">
        <div ref={box} className="absolute inset-0" />
        {(q.isPending || q.isError || !HAS_KEY) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-cream-card/90 p-4 text-center text-sm">
            {!HAS_KEY ? 'API key belum diisi. Chart menunggu data asli.'
              : q.isError ? (<>
                  <span>{q.error instanceof RateLimitError ? 'Market data sedang mencapai batas request. Data akan diperbarui kembali setelah limit tersedia.' : 'Market data sementara tidak tersedia.'}</span>
                  <button onClick={() => q.refetch()} className="inline-flex items-center gap-2 rounded-full bg-maroon px-4 py-2 font-semibold text-white"><RefreshCw size={14} /> COBA LAGI</button>
                </>)
              : <div className="h-full w-full animate-pulse bg-softgray/50" />}
          </div>
        )}
      </div>
    </div>
  )
}
