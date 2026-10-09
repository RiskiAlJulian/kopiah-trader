import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { fetchAcademyProgress, upsertAcademyProgress, type ProgressMap } from '../services/academyService'

export function useAcademyProgress() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['academy_progress', user?.id],
    queryFn: () => fetchAcademyProgress(user!.id),
    enabled: !!user
  })

  const submitQuiz = useMutation({
    mutationFn: (vars: { lessonId: string; score: number; total: number }) =>
      upsertAcademyProgress(user!.id, vars.lessonId, vars.score, vars.total),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academy_progress', user?.id] })
  })

  const progress: ProgressMap = query.data ?? {}
  return { progress, isLoading: query.isLoading, isError: query.isError, refetch: query.refetch, submitQuiz }
}
