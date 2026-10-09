import { supabase } from '../lib/supabaseClient'

export interface ProgressRow { lesson_id: string; is_completed: boolean; quiz_score: number; quiz_total: number }
export type ProgressMap = Record<string, { done: boolean; score: number; total: number }>

export async function fetchAcademyProgress(userId: string): Promise<ProgressMap> {
  const { data, error } = await supabase
    .from('academy_progress').select('lesson_id,is_completed,quiz_score,quiz_total').eq('user_id', userId)
  if (error) throw error
  const map: ProgressMap = {}
  for (const row of data as ProgressRow[]) map[row.lesson_id] = { done: row.is_completed, score: row.quiz_score, total: row.quiz_total }
  return map
}

export async function upsertAcademyProgress(userId: string, lessonId: string, score: number, total: number): Promise<void> {
  const { error } = await supabase.from('academy_progress').upsert(
    { user_id: userId, lesson_id: lessonId, is_completed: true, quiz_score: score, quiz_total: total, completed_at: new Date().toISOString() },
    { onConflict: 'user_id,lesson_id' }
  )
  if (error) throw error
}
