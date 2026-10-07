import { useEffect, useRef } from 'react'
import { tradingViewSymbol } from '../lib/config'

export default function TradingViewSymbolInfo({ symbolId }: { symbolId: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      symbol: tradingViewSymbol(symbolId),
      width: '100%',
      locale: 'id',
      colorTheme: 'light',
      isTransparent: false
    })
    el.appendChild(script)
  }, [symbolId])

  return (
    <div className="overflow-hidden rounded-2xl border border-softgray bg-cream-card p-2">
      <div ref={containerRef} />
    </div>
  )
}