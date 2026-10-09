import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { MATERIALS } from '../data/academy'
import Illustration from '../components/academy/Illustration'
import { useAcademyProgress } from '../hooks/useAcademyProgress'

export default function AcademyDetailPage() {
  const { id = '' } = useParams()
  const material = MATERIALS.find((m) => m.id === id)
  const { progress, isLoading, submitQuiz } = useAcademyProgress()
  const [answers, setAnswers] = useState<number[]>([])
  const [saveError, setSaveError] = useState<string | null>(null)

  if (!material) return <Navigate to="/academy" replace />
  const existing = progress[material.id]

  const submit = async () => {
    setSaveError(null)
    const score = material.quiz.reduce((s, q, i) => s + (answers[i] === q.correct ? 1 : 0), 0)
    try {
      await submitQuiz.mutateAsync({ lessonId: material.id, score, total: material.quiz.length })
    } catch {
      setSaveError('Gagal menyimpan skor ke server. Periksa koneksi lalu coba lagi.')
    }
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
        <h2 className="font-bold">Quiz</h2>

        {isLoading ? (
          <div className="mt-4 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-softgray/60" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-softgray/60" />
          </div>
        ) : existing?.done ? (
          <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
            Kamu sudah menyelesaikan quiz ini. Skor: {existing.score}/{existing.total}
          </p>
        ) : (
          <>
            <div className="mt-3 space-y-4">
              {material.quiz.map((q, qi) => (
                <div key={qi}>
                  <p className="text-sm font-medium">{qi + 1}. {q.question}</p>
                  <div className="mt-2 space-y-1.5">
                    {q.options.map((opt, oi) => (
                      <label key={oi} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${answers[qi] === oi ? 'border-maroon bg-white' : 'border-softgray'}`}>
                        <input type="radio" name={`q${qi}`} checked={answers[qi] === oi}
                          onChange={() => setAnswers((a) => { const n = [...a]; n[qi] = oi; return n })} />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {saveError && <p className="mt-3 text-sm text-maroon">{saveError}</p>}
            <button onClick={submit} disabled={answers.length < material.quiz.length || submitQuiz.isPending}
              className="mt-4 rounded-full bg-maroon px-5 py-2 font-semibold text-white disabled:opacity-40">
              {submitQuiz.isPending ? 'Menyimpan…' : 'Selesai & Cek Jawaban'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
