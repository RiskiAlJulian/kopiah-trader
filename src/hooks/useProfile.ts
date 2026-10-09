import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { fetchProfile, updateProfile } from '../services/profileService'

export function useProfile() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const key = ['profile', user?.id] as const

  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchProfile(user!.id, user!.email?.split('@')[0] ?? 'trader'),
    enabled: !!user
  })

  const save = useMutation({
    mutationFn: (patch: { username?: string; traderLevel?: string }) => updateProfile(user!.id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: key })
  })

  return { profile: query.data, isLoading: query.isLoading, isError: query.isError, refetch: query.refetch, save }
}
