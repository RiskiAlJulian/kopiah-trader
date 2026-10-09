import { Link } from 'react-router-dom'
import { BarChart3, BookOpen, Bot, Calculator, ChevronRight, Newspaper, NotebookPen, Users } from 'lucide-react'
import Logo from '../components/Logo'
import TradingViewTicker from '../components/TradingViewTicker'
import TradingViewSymbolInfo from '../components/TradingViewSymbolInfo'
import { LIVE_SCHEDULE, SOCIAL_LINKS } from '../data/live'
import { SYMBOLS } from '../lib/config'

// Montserrat dimuat dari index.html. Kalau belum termuat, otomatis memakai font sistem.
const display = { fontFamily: "'Montserrat', system-ui, sans-serif" } as const

const WEEKDAY_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const PLATFORM_LABEL: Record<keyof typeof SOCIAL_LINKS, string> = { tiktok: 'TikTok', youtube: 'YouTube', instagram: 'Instagram' }

const STEPS = [
  { word: 'Belajar.', to: '/academy', icon: BookOpen, text: 'Materi, video, dan quiz di Academy' },
  { word: 'Menganalisis.', to: '/market', icon: BarChart3, text: `${SYMBOLS.length} instrumen dengan chart TradingView` },
  { word: 'Berproses.', to: '/journal', icon: NotebookPen, text: 'Catat setiap trade dan evaluasi hasilnya' }
]

const MORE = [
  { to: '/news', icon: Newspaper, title: 'Economic News', text: 'Kalender berita ekonomi, fokus USD' },
  { to: '/calculator', icon: Calculator, title: 'Calculator', text: 'Hitung lot, risiko, dan rasio RR' },
  { to: '/ai', icon: Bot, title: 'KOPIAH TRADER AI', text: 'Tanya istilah dan konsep trading' },
  { to: '/community', icon: Users, title: 'Community', text: 'Diskusi dan berbagi analisis' }
]

const withWib = (t: string) => (/wib/i.test(t) ? t : `${t} WIB`)

/** Cari jadwal live terdekat (hari ini atau hari kerja berikutnya yang punya jadwal). */
function nextLive() {
  const now = new Date()
  for (let i = 0; i < 7; i++) {
    const name = WEEKDAY_ID[(now.getDay() + i) % 7]
    const entry = LIVE_SCHEDULE.find((s) => s.day === name && s.platform && !/libur|belum/i.test(s.time))
    if (entry) return { entry, isToday: i === 0 }
  }
  return null
}

function LiveBlock() {
  const next = nextLive()
  const url = next?.entry.platform ? SOCIAL_LINKS[next.entry.platform] : ''
  return (
    <section className="border-l-4 border-maroon pl-4">
      <h2 className="font-bold" style={display}>Live trade</h2>
      {next && next.entry.platform ? (
        <>
          <p className="mt-1.5 flex items-center gap-2 text-sm text-charcoal/80">
            {next.isToday && <span className="h-2 w-2 shrink-0 rounded-full bg-maroon motion-safe:animate-pulse" />}
            {next.isToday ? 'Hari ini' : next.entry.day}, {withWib(next.entry.time)} di {PLATFORM_LABEL[next.entry.platform]}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {url && (
              <a href={url} target="_blank" rel="noreferrer" className="rounded-full bg-maroon px-5 py-2 text-sm font-bold text-white hover:bg-maroon-dark">
                Tonton live
              </a>
            )}
            <Link to="/live" className="text-sm font-semibold text-maroon hover:underline">Lihat jadwal lengkap</Link>
          </div>
        </>
      ) : (
        <>
          <p className="mt-1.5 text-sm text-charcoal/70">Jadwal live belum diatur.</p>
          <Link to="/live" className="mt-3 inline-block text-sm font-semibold text-maroon hover:underline">Buka halaman Live Trade</Link>
        </>
      )}
    </section>
  )
}

export default function HomePage() {
  const socials = (Object.keys(SOCIAL_LINKS) as (keyof typeof SOCIAL_LINKS)[]).filter((k) => SOCIAL_LINKS[k])

  return (
    <div className="mx-auto max-w-6xl">
      <TradingViewTicker />

      <section className="mt-4 overflow-hidden rounded-3xl bg-charcoal text-cream">
        <div className="grid gap-6 p-5 sm:p-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-start lg:p-10">
          <div className="md:col-start-1 md:row-start-1">
            <div>
              {STEPS.map((s) => (
                <Link key={s.to} to={s.to} className="group flex items-center gap-4 border-t border-white/15 py-4 transition-colors hover:bg-white/5 sm:py-5">
                  <div className="min-w-0 flex-1">
                    <div className="text-[1.7rem] font-extrabold leading-none tracking-tight sm:text-5xl" style={display}>{s.word}</div>
                    <p className="mt-2 text-sm text-white/60">{s.text}</p>
                  </div>
                  <ChevronRight size={22} className="shrink-0 text-white/35 transition-transform group-hover:translate-x-1 group-hover:text-white" />
                </Link>
              ))}
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60">
              Platform trading untuk membantu trader membangun proses, disiplin, dan karakter.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/academy" className="rounded-full bg-cream px-6 py-2.5 text-sm font-bold text-charcoal hover:bg-white">Mulai sekarang</Link>
              <Link to="/market" className="rounded-full border border-white/30 px-6 py-2.5 text-sm font-bold hover:bg-white/10">Lihat market</Link>
            </div>
          </div>

          <div className="md:col-start-2 md:row-start-1">
            <div className="w-fit overflow-hidden rounded-2xl bg-cream p-1.5 shadow-lg shadow-black/30">
              <div className="overflow-hidden rounded-xl md:hidden"><Logo size={104} /></div>
              <div className="hidden overflow-hidden rounded-xl md:block"><Logo size={210} /></div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-2 md:items-start">
        <section>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h2 className="font-bold" style={display}>Gold sekarang</h2>
            <Link to="/market/XAUUSD" className="text-sm font-semibold text-maroon hover:underline">Buka chart XAUUSD</Link>
          </div>
          <TradingViewSymbolInfo symbolId="XAUUSD" />
          <p className="mt-2 text-[11px] text-charcoal/50">Harga dari TradingView. Bisa berbeda tipis dengan kuotasi broker kamu.</p>
        </section>
        <LiveBlock />
      </div>

      <section className="mt-8">
        <h2 className="mb-1 font-bold" style={display}>Fitur lainnya</h2>
        <div className="grid md:grid-cols-2 md:gap-x-10">
          {MORE.map(({ to, icon: I, title, text }) => (
            <Link key={to} to={to} className="group flex items-center gap-4 border-b border-softgray py-3.5 transition-colors hover:bg-white/60">
              <I size={20} className="shrink-0 text-maroon" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{title}</div>
                <div className="text-sm text-charcoal/60">{text}</div>
              </div>
              <ChevronRight size={18} className="shrink-0 text-charcoal/30 transition-colors group-hover:text-maroon" />
            </Link>
          ))}
        </div>
      </section>

      <footer className="mt-8 pb-2 text-xs leading-relaxed text-charcoal/50">
        {socials.length > 0 && (
          <p className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
            {socials.map((k) => (
              <a key={k} href={SOCIAL_LINKS[k]} target="_blank" rel="noreferrer" className="text-charcoal/70 underline-offset-4 hover:text-maroon hover:underline">
                {PLATFORM_LABEL[k]}
              </a>
            ))}
          </p>
        )}
        Konten KOPIAH TRADER bersifat edukasi, bukan saran trading, dan tidak menjamin profit. Selalu terapkan risk management.
      </footer>
    </div>
  )
}
