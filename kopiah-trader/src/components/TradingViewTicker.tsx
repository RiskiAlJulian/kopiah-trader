import { useEffect, useRef } from 'react'
import { tradingViewSymbol } from '../lib/config'

// Instrumen yang berjalan di pita harga. Ubah daftar ini kalau mau menambah/mengurangi.
const ITEMS: { id: string; title: string }[] = [
  { id: 'XAUUSD', title: 'Gold' }, { id: 'EURUSD', title: 'EUR/USD' }, { id: 'GBPUSD', title: 'GBP/USD' },
  { id: 'USDJPY', title: 'USD/JPY' }, { id: 'BTCUSD', title: 'Bitcoin' }, { id: 'USOIL', title: 'Minyak WTI' },
  { id: 'US500', title: 'S&P 500' }, { id: 'DXY', title: 'Dollar Index' }
]

/** Pita harga berjalan resmi dari TradingView (gratis, tanpa API key). */
export default function TradingViewTicker() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.innerHTML = ''
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      symbols: ITEMS.map((i) => ({ proName: tradingViewSymbol(i.id), title: i.title })),
      showSymbolLogo: true,
      colorTheme: 'light',
      isTransparent: false,
      displayMode: 'adaptive',
      locale: 'id'
    })
    el.appendChild(script)
  }, [])

  return <div ref={ref} className="min-h-[46px] overflow-hidden rounded-2xl border border-softgray bg-white" />
}
