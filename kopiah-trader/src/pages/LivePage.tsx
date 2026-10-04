import { ExternalLink } from 'lucide-react'
import { LIVE_SCHEDULE, SOCIAL_LINKS } from '../data/live'

const WEEKDAY_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const PLATFORM_LABEL: Record<keyof typeof SOCIAL_LINKS, string> = { tiktok: 'TikTok', youtube: 'YouTube', instagram: 'Instagram' }

export default function LivePage() {
  const todayName = WEEKDAY_ID[new Date().getDay()]
  const today = LIVE_SCHEDULE.find((s) => s.day === todayName)
  const todayUrl = today?.platform ? SOCIAL_LINKS[today.platform] : ''
  const hasAnyLink = Object.values(SOCIAL_LINKS).some(Boolean)

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold">KOPIAH TRADER LIVE</h1>
      <p className="mt-1 text-charcoal/70">{today ? `Hari ini (${todayName})` : 'NEXT LIVE'}</p>

      <ul className="my-4 divide-y divide-softgray overflow-hidden rounded-2xl border border-softgray bg-cream-card">
        {LIVE_SCHEDULE.map((s) => (
          <li key={s.day} className={`flex items-center justify-between p-3 text-sm ${s.day === todayName ? 'bg-white' : ''}`}>
            <span className="flex items-center gap-2">
              <b>{s.day}</b>
              {s.day === todayName && <span className="rounded-full bg-maroon px-2 py-0.5 text-[10px] font-semibold text-white">HARI INI</span>}
            </span>
            <span className="text-charcoal/60">
              {s.time}{s.platform && ` · ${PLATFORM_LABEL[s.platform]}`}
            </span>
          </li>
        ))}
      </ul>

      <a href={todayUrl || undefined} target="_blank" rel="noreferrer" aria-disabled={!todayUrl}
        className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold text-white ${todayUrl ? 'bg-maroon hover:bg-maroon-dark' : 'pointer-events-none bg-charcoal/30'}`}>
        WATCH LIVE {today?.platform && `di ${PLATFORM_LABEL[today.platform]}`}
      </a>
      {!todayUrl && <p className="mt-2 text-xs text-charcoal/60">Belum ada jadwal live untuk hari ini, atau link platform-nya belum diisi di src/data/live.ts.</p>}

      <div className="mt-8">
        <h2 className="mb-2 font-bold">Ikuti Kami</h2>
        {!hasAnyLink && <p className="text-sm text-charcoal/60">Link media sosial belum diisi. Buka src/data/live.ts untuk mengisi SOCIAL_LINKS.</p>}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(SOCIAL_LINKS) as (keyof typeof SOCIAL_LINKS)[]).map((key) => {
            const url = SOCIAL_LINKS[key]
            return (
              <a key={key} href={url || undefined} target="_blank" rel="noreferrer" aria-disabled={!url}
                className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold ${url ? 'border-maroon text-maroon hover:bg-maroon hover:text-white' : 'pointer-events-none border-softgray text-charcoal/30'}`}>
                {PLATFORM_LABEL[key]} <ExternalLink size={14} />
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
