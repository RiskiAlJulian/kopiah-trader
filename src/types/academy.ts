export type Level = 'BEGINNER' | 'TECHNICAL'
export interface QuizQuestion { question: string; options: string[]; correct: number }
export interface Material {
  id: string; title: string; description: string; level: Level
  content: string[]
  illustration: 'trend' | 'structure' | 'orderblock' | 'fvg' | 'liquidity' | 'supply-demand' | 'lot' | 'none'
  quiz: QuizQuestion[]
}
