import { useEffect, useRef, useState } from 'react'
import Logo from './Logo'

// Atur durasi di sini (milidetik). Total tampil = FADE_START + FADE_DURATION.
const FADE_START = 1900
const FADE_DURATION = 500

/** Animasi pembuka: logo muncul, tagline naik, progress bar berjalan, lalu layar memudar ke aplikasi. */
export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    // Hormati pengaturan "kurangi animasi" di HP: tampil singkat saja.
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const t1 = setTimeout(() => setLeaving(true), reduce ? 200 : FADE_START)
    const t2 = setTimeout(() => doneRef.current(), reduce ? 400 : FADE_START + FADE_DURATION)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-cream px-6 text-center"
      style={{ opacity: leaving ? 0 : 1, transition: `opacity ${FADE_DURATION}ms ease` }}
    >
      <style>{`
        @keyframes kt-logo { 0% { opacity: 0; transform: scale(.88) translateY(8px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes kt-tag { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes kt-bar { 0% { width: 0%; } 100% { width: 100%; } }
        @media (prefers-reduced-motion: reduce) {
          .kt-logo, .kt-tag, .kt-bar { animation: none !important; opacity: 1 !important; width: 100% !important; }
        }
      `}</style>
      <div className="kt-logo" style={{ animation: 'kt-logo 800ms cubic-bezier(.2,.8,.2,1) both' }}>
        <Logo size={220} />
      </div>
      <p className="kt-tag mt-4 text-xs font-medium tracking-[0.25em] text-charcoal/60" style={{ animation: 'kt-tag 700ms ease 500ms both' }}>
        BELAJAR. MENGANALISIS. BERPROSES.
      </p>
      <div className="mt-8 h-1 w-44 overflow-hidden rounded-full bg-softgray">
        <div className="kt-bar h-full bg-maroon" style={{ animation: `kt-bar ${FADE_START}ms ease-in-out both` }} />
      </div>
    </div>
  )
}
