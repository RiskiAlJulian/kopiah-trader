import { Link, Navigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { MATERIALS } from '../data/academy'
import { QUIZ_BANK } from '../data/quizBank'
import Illustration from '../components/academy/Illustration'
import QuizRunner from '../components/academy/QuizRunner'
import { useAcademyProgress } from '../hooks/useAcademyProgress'
import { PASS_RATIO, isAttempted, isPassed, shouldSave } from '../lib/quiz'

export default function AcademyDetailPage() {
  const { id = '' } = useParams()
  const material = MATERIALS.find((m) => m.id === id)
  const { progress, isLoading, submitQuiz } = useAcademyProgress()

  if (!material) return <Navigate to="/academy" replace />

  const questions = QUIZ_BANK[material.id] ?? []
  const prev = progress[material.id]

  const handleFinish = async (score: number, total: number) => {
    if (shouldSave(prev, score, total)) await submitQuiz.mutateAsync({ lessonId: material.id, score, total })
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/academy" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-charcoal/70 hover:text-charcoal"><ChevronLeft size={16} />Kembali ke Academy</Link>
      <span className="rounded-full bg-softgray/60 px-2 py-0.5 text-[11px] font-semibold">{material.level}</span>
      <h1 className="mt-2 text-2xl font-bold">{material.title}</h1>
      <p className="mt-1 text-charcoal/70">{material.description}</p>

      <div className="mt-5 space-y-3">
        {material.content.map((p, i) => <p key={i} className="text-sm leading-relaxed text-charcoal/90">{p}</p>)}
      </div>

      {material.illustration !== 'none' && (
        <div className="mt-5">
          <div className="mb-1 text-xs font-semibold text-charcoal/50">Ilustrasi / Contoh Chart</div>
          <Illustration kind={material.illustration} />
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-softgray bg-cream-card p-5">
        <h2 className="font-bold">Kuis {material.title}</h2>
        <p className="mt-1 text-sm text-charcoal/60">
          {questions.length} soal dari tingkat Pemula sampai Profesional & Analis. Lulus dengan nilai minimal {Math.round(PASS_RATIO * 100)}%.
          {isAttempted(prev) && <> Skor terbaikmu: <b className={isPassed(prev) ? 'text-emerald-700' : ''}>{prev!.score}/{prev!.total}</b>{isPassed(prev) ? ' (lulus)' : ''}.</>}
        </p>
        <div className="mt-5">
          {isLoading ? (
            <div className="space-y-2"><div className="h-4 w-3/4 animate-pulse rounded bg-softgray/60" /><div className="h-4 w-1/2 animate-pulse rounded bg-softgray/60" /></div>
          ) : questions.length === 0 ? (
            <p className="text-sm text-charcoal/60">Belum ada soal untuk materi ini.</p>
          ) : (
            <QuizRunner questions={questions} groupByLevel onFinish={handleFinish} />
          )}
        </div>
      </div>
    </div>
  )
}
