import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { materialsByLevel } from '../data/academy'
import { useAcademyProgress } from '../hooks/useAcademyProgress'

function Section({ title, level }: { title: string; level: 'BEGINNER' | 'TECHNICAL' }) {
  const { progress, isLoading, isError, refetch } = useAcademyProgress()
  const items = materialsByLevel(level)
  const done = items.filter((m) => progress[m.id]?.done).length

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        {!isLoading && !isError && <span className="text-xs text-charcoal/50">{done}/{items.length} selesai</span>}
      </div>

      {isError && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-red-50 p-3 text-sm text-maroon">
          <span>Gagal memuat progress dari server.</span>
          <button onClick={() => refetch()} className="font-semibold underline">Coba lagi</button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((m) => {
          const p = progress[m.id]
          return (
            <Link key={m.id} to={`/academy/${m.id}`} className="flex flex-col justify-between rounded-2xl border border-softgray bg-cream-card p-4 shadow-sm transition hover:shadow-md">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-softgray/60 px-2 py-0.5 text-[11px] font-semibold">{m.level}</span>
                  {isLoading ? <div className="h-4 w-16 animate-pulse rounded bg-softgray/60" /> : p?.done && (
                    <span className="text-[11px] font-semibold text-emerald-700">Selesai · {p.score}/{p.total}</span>
                  )}
                </div>
                <h3 className="mt-2 font-bold">{m.title}</h3>
                <p className="mt-1 text-sm text-charcoal/70">{m.description}</p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-softgray/60">
                  <div className="h-full bg-maroon" style={{ width: p?.done ? '100%' : '0%' }} />
                </div>
                <ChevronRight size={16} className="text-charcoal/40" />
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export default function AcademyPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">KOPIAH TRADER ACADEMY</h1>
        <p className="text-charcoal/70">Materi belajar trading, dari dasar hingga konsep teknikal. Progress tersimpan di akunmu dan tersinkron di semua perangkat.</p>
      </div>
      <Section title="Beginner" level="BEGINNER" />
      <Section title="Technical" level="TECHNICAL" />
    </div>
  )
}
