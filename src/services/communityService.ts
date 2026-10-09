import { supabase } from '../lib/supabaseClient'
import { fetchUsernames } from './profileService'
import type { Comment, Post, PostCategory } from '../types/community'

interface PostRow { id: string; user_id: string; category: PostCategory; content: string; created_at: string }
interface CommentRow { id: string; user_id: string; content: string; created_at: string }

export async function fetchPosts(currentUserId: string, category?: PostCategory): Promise<Post[]> {
  let q = supabase.from('community_posts').select('*').order('created_at', { ascending: false })
  if (category) q = q.eq('category', category)
  const { data: posts, error } = await q
  if (error) throw error
  const rows = posts as PostRow[]
  if (rows.length === 0) return []

  const ids = rows.map((p) => p.id)
  const [{ data: likes, error: likeErr }, { data: bookmarks, error: bmErr }, usernames] = await Promise.all([
    supabase.from('community_likes').select('post_id,user_id').in('post_id', ids),
    supabase.from('community_bookmarks').select('post_id').eq('user_id', currentUserId).in('post_id', ids),
    fetchUsernames(rows.map((p) => p.user_id))
  ])
  if (likeErr) throw likeErr
  if (bmErr) throw bmErr

  const { data: comments, error: cErr } = await supabase.from('community_comments').select('post_id').in('post_id', ids)
  if (cErr) throw cErr

  const likeCount: Record<string, number> = {}
  const likedByMe = new Set<string>()
  for (const l of (likes ?? []) as { post_id: string; user_id: string }[]) {
    likeCount[l.post_id] = (likeCount[l.post_id] ?? 0) + 1
    if (l.user_id === currentUserId) likedByMe.add(l.post_id)
  }
  const commentCount: Record<string, number> = {}
  for (const c of (comments ?? []) as { post_id: string }[]) commentCount[c.post_id] = (commentCount[c.post_id] ?? 0) + 1
  const bookmarked = new Set((bookmarks ?? []).map((b: { post_id: string }) => b.post_id))

  return rows.map((p) => ({
    id: p.id, userId: p.user_id, username: usernames[p.user_id] ?? 'Trader',
    category: p.category, content: p.content, createdAt: p.created_at,
    likeCount: likeCount[p.id] ?? 0, commentCount: commentCount[p.id] ?? 0,
    likedByMe: likedByMe.has(p.id), bookmarkedByMe: bookmarked.has(p.id)
  }))
}

export async function createPost(userId: string, category: PostCategory, content: string): Promise<void> {
  const { error } = await supabase.from('community_posts').insert({ user_id: userId, category, content })
  if (error) throw error
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from('community_posts').delete().eq('id', id)
  if (error) throw error
}

export async function toggleLike(postId: string, userId: string, liked: boolean): Promise<void> {
  if (liked) {
    const { error } = await supabase.from('community_likes').delete().eq('post_id', postId).eq('user_id', userId)
    if (error) throw error
  } else {
    const { error } = await supabase.from('community_likes').insert({ post_id: postId, user_id: userId })
    if (error) throw error
  }
}

export async function toggleBookmark(postId: string, userId: string, bookmarked: boolean): Promise<void> {
  if (bookmarked) {
    const { error } = await supabase.from('community_bookmarks').delete().eq('post_id', postId).eq('user_id', userId)
    if (error) throw error
  } else {
    const { error } = await supabase.from('community_bookmarks').insert({ post_id: postId, user_id: userId })
    if (error) throw error
  }
}

export async function reportPost(postId: string, userId: string, reason: string): Promise<void> {
  const { error } = await supabase.from('community_reports').insert({ post_id: postId, user_id: userId, reason })
  if (error) throw error
}

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase.from('community_comments').select('*').eq('post_id', postId).order('created_at', { ascending: true })
  if (error) throw error
  const rows = data as CommentRow[]
  const usernames = await fetchUsernames(rows.map((c) => c.user_id))
  return rows.map((c) => ({ id: c.id, userId: c.user_id, username: usernames[c.user_id] ?? 'Trader', content: c.content, createdAt: c.created_at }))
}

export async function addComment(postId: string, userId: string, content: string): Promise<void> {
  const { error } = await supabase.from('community_comments').insert({ post_id: postId, user_id: userId, content })
  if (error) throw error
}
