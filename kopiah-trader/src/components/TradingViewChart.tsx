import { useEffect, useRef } from 'react'
import { tradingViewSymbol } from '../lib/config'

export default function TradingViewChart({ symbolId }: { symbolId: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tradingViewSymbol(symbolId),
      interval: '15',
      timezone: 'Asia/Jakarta',
      theme: 'light',
      style: '1',
      locale: 'id',
      allow_symbol_change: false,
      hide_side_toolbar: false,
      withdateranges: true,
      support_host: 'https://www.tradingview.com'
    })
    el.appendChild(script)
  }, [symbolId])

  return (
    <div className="rounded-2xl border border-softgray bg-cream-card p-2">
      <div className="h-[420px] w-full md:h-[560px]" ref={containerRef} />
      <p className="mt-1 px-1 text-[11px] text-charcoal/50">Chart resmi dari TradingView — harga di sini selalu sama dengan tradingview.com.</p>
    </div>
  )
} 