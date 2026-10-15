import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import QuizRunner from '../components/academy/QuizRunner'
import { useAcademyProgress } from '../hooks/useAcademyProgress'
import { LEVELS, LEVEL_QUIZ_SIZE, PASS_RATIO, isAttempted, isLevelUnlocked, isPassed, levelKey, levelPool, sample, shouldSave } from '../lib/quiz'

export default function LevelQuizPage() {
  const { level = '' } = useParams()
  const idx = LEVELS.findIndex((l) => l.id === level)
  const { progress, isLoading, submitQuiz } = useAcademyProgress()
  const [attempt, setAttempt] = useState(0)
  const [last, setLast] = useState<{ score: number; total: number } | null>(null)

  // Soal diacak tiap percobaan baru.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const questions = useMemo(() => (idx < 0 ? [] : sample(levelPool(LEVELS[idx].id), LEVEL_QUIZ_SIZE)), [idx, attempt])

  if (idx < 0) return <Navigate to="/academy" replace />

  const lv = LEVELS[idx]
  const key = levelKey(lv.id)
  const prev = progress[key]
  const unlocked = isLevelUnlocked(progress, idx)
  const next = LEVELS[idx + 1]
  const lastPassed = last ? isPassed({ done: true, ...last }) : false

  const handleFinish = async (score: number, total: number) => {
    setLast({ score, total })
    if (shouldSave(prev, score, total)) await submitQuiz.mutateAsync({ lessonId: key, score, total })
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/academy" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-charcoal/70 hover:text-charcoal"><ChevronLeft size={16} />Kembali ke Academy</Link>
      <p className="text-sm text-charcoal/50">Tantangan Level {idx + 1}</p>
      <h1 className="text-2xl font-bold">{lv.label}</h1>
      <p className="mt-1 text-charcoal/70">{lv.desc}</p>
      <p className="mt-3 text-sm text-charcoal/60">
        {LEVEL_QUIZ_SIZE} soal acak dari seluruh materi. Lulus dengan nilai minimal {Math.round(PASS_RATIO * 100)}%.
        {isAttempted(prev) && <> Skor terbaikmu: <b>{prev!.score}/{prev!.total}</b>.</>}
      </p>

      <div className="mt-5 rounded-2xl border border-softgray bg-cream-card p-5">
        {isLoading ? (
          <div className="space-y-2"><div className="h-4 w-3/4 animate-pulse rounded bg-softgray/60" /><div className="h-4 w-1/2 animate-pulse rounded bg-softgray/60" /></div>
        ) : !unlocked ? (
          <div className="text-sm">
            <p className="font-semibold">Level ini masih terkunci.</p>
            <p className="mt-1 text-charcoal/70">Lulus Tantangan Level {idx} ({LEVELS[idx - 1].label}) dulu untuk membukanya.</p>
            <Link to={`/academy/level/${LEVELS[idx - 1].id}`} className="mt-3 inline-block font-semibold text-maroon underline">Ke level {LEVELS[idx - 1].label}</Link>
          </div>
        ) : (
          <>
            <QuizRunner questions={questions} onFinish={handleFinish} onRetry={() => { setLast(null); setAttempt((a) => a + 1) }} />
            {lastPassed && (
              <div className="mt-5 rounded-xl bg-white p-4 text-sm">
                {next
                  ? <>Level <b>{next.label}</b> sekarang terbuka. <Link to={`/academy/level/${next.id}`} className="font-semibold text-maroon underline">Lanjut ke level berikutnya</Link></>
                  : <>Kamu sudah menuntaskan semua tingkat sampai <b>Profesional & Analis</b>. Terus asah lewat Journal dan analisis chart.</>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
