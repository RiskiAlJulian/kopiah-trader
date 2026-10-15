import { Link } from 'react-router-dom'
import { CheckCircle2, ChevronRight, Lock } from 'lucide-react'
import { useAcademyProgress } from '../../hooks/useAcademyProgress'
import { LEVELS, LEVEL_QUIZ_SIZE, PASS_RATIO, isAttempted, isLevelUnlocked, isPassed, levelKey, rankOf } from '../../lib/quiz'

export default function LevelChallenges() {
  const { progress, isLoading } = useAcademyProgress()

  return (
    <section>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-4">
        <h2 className="text-lg font-bold">Tantangan Level</h2>
        {!isLoading && <span className="text-sm text-charcoal/60">Gelarmu: <b className="text-charcoal">{rankOf(progress)}</b></span>}
      </div>
      <p className="mb-3 text-sm text-charcoal/60">
        Kuis {LEVEL_QUIZ_SIZE} soal acak dari seluruh materi, dari Pemula sampai Profesional & Analis. Lulus dengan nilai minimal {Math.round(PASS_RATIO * 100)}% untuk membuka level berikutnya.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? LEVELS.map((l) => <div key={l.id} className="h-32 animate-pulse rounded-2xl bg-softgray/50" />)
          : LEVELS.map((l, i) => {
              const p = progress[levelKey(l.id)]
              const open = isLevelUnlocked(progress, i)
              const passed = isPassed(p)
              const body = (
                <>
                  <div className="flex items-center justify-between text-xs text-charcoal/50">
                    <span>Level {i + 1}</span>
                    {passed ? <CheckCircle2 size={16} className="text-emerald-700" aria-label="Lulus" /> : !open && <Lock size={14} aria-label="Terkunci" />}
                  </div>
                  <h3 className="mt-1 font-bold leading-tight">{l.label}</h3>
                  <p className="mt-1 text-sm text-charcoal/60">{l.desc}</p>
                  <p className="mt-2 text-xs font-semibold">
                    {passed ? <span className="text-emerald-700">Lulus {p!.score}/{p!.total}</span>
                      : isAttempted(p) ? <span className="text-charcoal/60">Terbaik {p!.score}/{p!.total}, coba lagi</span>
                      : open ? <span className="text-maroon">Mulai kuis</span>
                      : <span className="text-charcoal/50">Lulus level {i} dulu</span>}
                  </p>
                </>
              )
              return open ? (
                <Link key={l.id} to={`/academy/level/${l.id}`} className="flex flex-col justify-between rounded-2xl border border-softgray bg-cream-card p-4 shadow-sm transition hover:shadow-md">
                  <div>{body}</div>
                  <ChevronRight size={16} className="mt-2 self-end text-charcoal/40" />
                </Link>
              ) : (
                <div key={l.id} className="rounded-2xl border border-dashed border-softgray bg-cream-card/60 p-4 opacity-70">{body}</div>
              )
            })}
      </div>
    </section>
  )
}
