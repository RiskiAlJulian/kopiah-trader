export type QuizLevel = 'pemula' | 'menengah' | 'mahir' | 'profesional'

export interface LeveledQuestion {
  level: QuizLevel
  question: string
  options: string[]
  correct: number // indeks jawaban benar di options
  explanation: string
}
