import { QUIZ_BANK } from '../data/quizBank'
import type { LeveledQuestion, QuizLevel } from '../types/quiz'
import type { ProgressMap } from '../services/academyService'

/** Nilai minimal (70%) untuk lulus kuis materi maupun Tantangan Level. */
export const PASS_RATIO = 0.7
/** Hasil lama dengan soal lebih sedikit dari ini (kuis 1 soal versi awal) tidak dihitung. */
export const MIN_QUESTIONS = 4
/** Jumlah soal acak pada Tantangan Level. */
export const LEVEL_QUIZ_SIZE = 10

export const LEVELS: { id: QuizLevel; label: string; rank: string; desc: string }[] = [
  { id: 'pemula', label: 'Pemula', rank: 'Trader Pemula', desc: 'Istilah dan konsep dasar' },
  { id: 'menengah', label: 'Menengah', rank: 'Trader Menengah', desc: 'Mengenali dan menerapkan konsep pada chart' },
  { id: 'mahir', label: 'Mahir', rank: 'Trader Mahir', desc: 'Skenario, perhitungan, dan pengambilan keputusan' },
  { id: 'profesional', label: 'Profesional & Analis', rank: 'Analis Profesional', desc: 'Analisis multi-faktor, risiko portofolio, dan evaluasi strategi' }
]

export type Prog = { done: boolean; score: number; total: number }

export const isAttempted = (p?: Prog) => !!p && p.total >= MIN_QUESTIONS
export const isPassed = (p?: Prog) => !!p && p.total >= MIN_QUESTIONS && p.score / p.total >= PASS_RATIO

/** Kunci penyimpanan hasil Tantangan Level di tabel academy_progress (kolom lesson_id). */
export const levelKey = (l: QuizLevel) => `level|${l}`
export const levelLabel = (l: QuizLevel) => LEVELS.find((x) => x.id === l)?.label ?? l

export function levelPool(level: QuizLevel): LeveledQuestion[] {
  return Object.values(QUIZ_BANK).flat().filter((q) => q.level === level)
}

/** Ambil n elemen acak tanpa pengulangan (Fisher-Yates pada salinan). */
export function sample<T>(arr: readonly T[], n: number, rnd: () => number = Math.random): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, n)
}

/** Level pertama selalu terbuka; level berikutnya terbuka setelah level sebelumnya lulus. */
export function isLevelUnlocked(progress: ProgressMap, index: number): boolean {
  return index <= 0 || isPassed(progress[levelKey(LEVELS[index - 1].id)])
}

/** Gelar mengikuti level tertinggi yang sudah lulus. */
export function rankOf(progress: ProgressMap): string {
  for (let i = LEVELS.length - 1; i >= 0; i--) if (isPassed(progress[levelKey(LEVELS[i].id)])) return LEVELS[i].rank
  return 'Calon Trader'
}

export function gradeQuiz(questions: LeveledQuestion[], answers: (number | undefined)[]) {
  const total = questions.length
  const score = questions.reduce((s, q, i) => s + (answers[i] === q.correct ? 1 : 0), 0)
  const ratio = total ? score / total : 0
  return { score, total, ratio, passed: total >= MIN_QUESTIONS && ratio >= PASS_RATIO }
}

/** Simpan hanya jika belum ada hasil yang valid, atau hasil baru lebih baik dari yang tersimpan. */
export function shouldSave(prev: Prog | undefined, score: number, total: number): boolean {
  if (!isAttempted(prev)) return true
  return score / total > prev!.score / prev!.total
}
