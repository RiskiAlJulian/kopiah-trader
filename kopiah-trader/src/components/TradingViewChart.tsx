import { useEffect, useRef, useState } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import { tradingViewSymbol } from '../lib/config'

/**
 * Chart resmi TradingView (gratis, tanpa API key).
 * Tombol "Layar Penuh" selalu tampil:
 *  - Semua browser: chart menutupi seluruh layar (overlay CSS).
 *  - Android Chrome: ditambah fullscreen asli + kunci orientasi ke lanskap otomatis.
 */
export default function TradingViewChart({ symbolId }: { symbolId: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.innerHTML = '' // bersihkan widget lama saat ganti simbol

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
      allow_symbol_change: true,
      hide_side_toolbar: false,
      withdateranges: true,
      support_host: 'https://www.tradingview.com'
    })
    el.appendChild(script)
  }, [symbolId])

  // Kunci scroll halaman saat chart membesar.
  useEffect(() => {
    document.body.style.overflow = expanded ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [expanded])

  // Kalau user keluar fullscreen lewat gestur/tombol back HP, ikut tutup overlay.
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) {
        setExpanded(false)
        try { (screen.orientation as any)?.unlock?.() } catch { /* tidak didukung */ }
      }
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const open = async () => {
    setExpanded(true)
    try {
      await (wrapperRef.current as any)?.requestFullscreen?.()
      await (screen.orientation as any)?.lock?.('landscape')
    } catch {
      // Browser tidak mendukung (mis. iPhone): overlay CSS tetap jalan, putar HP manual ke lanskap.
    }
  }

  const close = async () => {
    setExpanded(false)
    try { (screen.orientation as any)?.unlock?.() } catch { /* tidak didukung */ }
    try { if (document.fullscreenElement) await document.exitFullscreen() } catch { /* abaikan */ }
  }

  return (
    <div
      ref={wrapperRef}
      className={expanded ? 'fixed inset-0 z-50 flex flex-col bg-white p-2' : 'rounded-2xl border border-softgray bg-cream-card p-2'}
    >
      <div className="mb-1 flex items-center justify-between gap-2 px-1">
        {!expanded && <p className="text-[11px] text-charcoal/50">Chart resmi dari TradingView.</p>}
        <button
          onClick={expanded ? close : open}
          className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full bg-maroon px-3 py-1.5 text-xs font-semibold text-white hover:bg-maroon-dark"
        >
          {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          {expanded ? 'Tutup' : 'Layar Penuh / Lanskap'}
        </button>
      </div>
      <div className={expanded ? 'min-h-0 w-full flex-1' : 'h-[420px] w-full md:h-[560px]'} ref={containerRef} />
    </div>
  )
}
