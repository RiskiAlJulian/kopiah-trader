import { useEffect, useRef, useState } from 'react'
import { tradingViewSymbol } from '../lib/config'

/**
 * Widget resmi TradingView "Single Quote": harga + perubahan, ringkas dan muat di layar HP.
 * Widget baru dimuat saat kartunya hampir terlihat di layar, supaya daftar Market yang panjang tetap ringan.
 * (Nama file dipertahankan supaya halaman lain tidak perlu diubah.)
 */
export default function TradingViewSymbolInfo({ symbolId }: { symbolId: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') { setVisible(true); return }
    const obs = new IntersectionObserver(
      (entries) => { if (entries.some((e) => e.isIntersecting)) { setVisible(true); obs.disconnect() } },
      { rootMargin: '300px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el || !visible) return
    el.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      symbol: tradingViewSymbol(symbolId),
      width: '100%',
      colorTheme: 'light',
      isTransparent: false,
      locale: 'id'
    })
    el.appendChild(script)
  }, [symbolId, visible])

  return (
    <div className="overflow-hidden rounded-2xl border border-softgray bg-cream-card p-2">
      <div ref={containerRef} className="min-h-[110px]" />
    </div>
  )
}
