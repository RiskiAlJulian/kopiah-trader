import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { PASS_RATIO, gradeQuiz, levelLabel } from '../../lib/quiz'
import type { LeveledQuestion } from '../../types/quiz'

const LETTERS = ['A', 'B', 'C', 'D', 'E']

interface Props {
  questions: LeveledQuestion[]
  /** Tampilkan judul tingkat (Pemula, Menengah, ...) di antara soal. */
  groupByLevel?: boolean
  /** Dipanggil saat jawaban dikirim; lempar error bila gagal menyimpan. */
  onFinish: (score: number, total: number) => Promise<void>
  /** Dipanggil saat tombol "Ulangi kuis" ditekan (mis. untuk mengacak soal baru). */
  onRetry?: () => void
}

export default function QuizRunner({ questions, groupByLevel, onFinish, onRetry }: Props) {
  const [answers, setAnswers] = useState<(number | undefined)[]>([])
  const [result, setResult] = useState<ReturnType<typeof gradeQuiz> | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const summaryRef = useRef<HTMLDivElement>(null)

  // Soal berganti (mis. diacak ulang) -> mulai bersih.
  useEffect(() => { setAnswers([]); setResult(null); setSaveError(false) }, [questions])
  useEffect(() => { if (result) summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [result])

  const locked = result !== null
  const answered = questions.filter((_, i) => answers[i] !== undefined).length

  const submit = async () => {
    const r = gradeQuiz(questions, answers)
    setSaving(true)
    setSaveError(false)
    try { await onFinish(r.score, r.total) } catch { setSaveError(true) }
    setSaving(false)
    setResult(r)
  }
  const reset = () => { setAnswers([]); setResult(null); setSaveError(false); onRetry?.() }

  return (
    <div>
      {result && (
        <div ref={summaryRef} className={`mb-5 rounded-xl p-4 ${result.passed ? 'bg-emerald-50 text-emerald-900' : 'bg-orange-50 text-orange-900'}`}>
          <p className="font-bold">
            {result.passed ? 'Lulus' : 'Belum lulus'}: {result.score}/{result.total} ({Math.round(result.ratio * 100)}%)
          </p>
          <p className="mt-1 text-sm">
            {result.passed
              ? 'Kerja bagus. Baca penjelasan tiap soal di bawah untuk memperdalam.'
              : `Nilai minimal untuk lulus ${Math.round(PASS_RATIO * 100)}%. Baca penjelasan di bawah, lalu coba lagi.`}
          </p>
          {saveError && <p className="mt-1 text-sm font-semibold text-maroon">Hasil belum tersimpan ke server. Periksa koneksi, lalu kirim ulang dengan mengulang kuis.</p>}
        </div>
      )}

      <div className="space-y-6">
        {questions.map((q, qi) => {
          const picked = answers[qi]
          const heading = groupByLevel && (qi === 0 || questions[qi - 1].level !== q.level)
          return (
            <div key={qi}>
              {heading && <h3 className="mb-3 border-b border-softgray pb-1 font-bold text-maroon">Tingkat {levelLabel(q.level)}</h3>}
              <p className="text-sm font-semibold leading-relaxed">{qi + 1}. {q.question}</p>
              <div className="mt-2 space-y-1.5">
                {q.options.map((opt, oi) => {
                  const isCorrect = oi === q.correct
                  const isPicked = oi === picked
                  let cls = 'border-softgray bg-white hover:border-maroon/50'
                  if (locked) cls = isCorrect ? 'border-emerald-600 bg-emerald-50' : isPicked ? 'border-maroon bg-red-50' : 'border-softgray bg-white opacity-60'
                  else if (isPicked) cls = 'border-maroon bg-white ring-1 ring-maroon'
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={locked}
                      aria-pressed={isPicked}
                      onClick={() => setAnswers((a) => { const n = [...a]; n[qi] = oi; return n })}
                      className={`flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm ${cls}`}
                    >
                      <span className="mt-0.5 shrink-0 font-semibold text-charcoal/50">{LETTERS[oi]}.</span>
                      <span className="min-w-0 flex-1">{opt}</span>
                      {locked && isCorrect && <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-700" aria-label="Jawaban benar" />}
                      {locked && isPicked && !isCorrect && <XCircle size={18} className="mt-0.5 shrink-0 text-maroon" aria-label="Jawabanmu" />}
                    </button>
                  )
                })}
              </div>
              {locked && (
                <p className="mt-2 rounded-lg bg-cream p-3 text-sm leading-relaxed">
                  <strong>{picked === q.correct ? 'Benar.' : 'Kurang tepat.'}</strong> {q.explanation}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-6">
        {locked ? (
          <button type="button" onClick={reset} className="rounded-full border border-maroon px-5 py-2 font-semibold text-maroon hover:bg-maroon hover:text-white">
            Ulangi kuis
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={answered < questions.length || saving || questions.length === 0}
            className="rounded-full bg-maroon px-5 py-2 font-semibold text-white disabled:opacity-40"
          >
            {saving ? 'Menyimpan…' : `Kirim jawaban (${answered}/${questions.length})`}
          </button>
        )}
      </div>
    </div>
  )
}
