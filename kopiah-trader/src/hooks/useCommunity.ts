import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import {
  addComment, createPost, deletePost, fetchComments, fetchPosts,
  reportPost, toggleBookmark, toggleLike
} from '../services/communityService'
import type { PostCategory } from '../types/community'

export function usePosts(category?: PostCategory) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const key = ['community_posts', category ?? 'ALL'] as const

  const query = useQuery({ queryKey: key, queryFn: () => fetchPosts(user!.id, category), enabled: !!user })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['community_posts'] })

  const create = useMutation({
    mutationFn: (vars: { category: PostCategory; content: string }) => createPost(user!.id, vars.category, vars.content),
    onSuccess: invalidate
  })
  const remove = useMutation({ mutationFn: (postId: string) => deletePost(postId), onSuccess: invalidate })
  const like = useMutation({
    mutationFn: (vars: { postId: string; liked: boolean }) => toggleLike(vars.postId, user!.id, vars.liked),
    onSuccess: invalidate
  })
  const bookmark = useMutation({
    mutationFn: (vars: { postId: string; bookmarked: boolean }) => toggleBookmark(vars.postId, user!.id, vars.bookmarked),
    onSuccess: invalidate
  })
  const report = useMutation({ mutationFn: (vars: { postId: string; reason: string }) => reportPost(vars.postId, user!.id, vars.reason) })

  return { posts: query.data ?? [], isLoading: query.isLoading, isError: query.isError, refetch: query.refetch, create, remove, like, bookmark, report }
}

export function useComments(postId: string) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const key = ['community_comments', postId] as const

  const query = useQuery({ queryKey: key, queryFn: () => fetchComments(postId), enabled: !!postId })
  const add = useMutation({
    mutationFn: (content: string) => addComment(postId, user!.id, content),
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); qc.invalidateQueries({ queryKey: ['community_posts'] }) }
  })

  return { comments: query.data ?? [], isLoading: query.isLoading, isError: query.isError, add }
}
