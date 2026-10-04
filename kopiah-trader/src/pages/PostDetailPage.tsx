import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, Send } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { usePosts, useComments } from '../hooks/useCommunity'
import PostCard from '../components/community/PostCard'

export default function PostDetailPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const { posts, like, bookmark, report, remove } = usePosts()
  const { comments, isLoading, add } = useComments(id)
  const [text, setText] = useState('')

  const post = posts.find((p) => p.id === id)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    add.mutate(text, { onSuccess: () => setText('') })
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/community" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-charcoal/70 hover:text-charcoal"><ChevronLeft size={16} />Kembali ke Hub</Link>

      {post ? (
        <PostCard post={post} currentUserId={user?.id}
          onLike={() => like.mutate({ postId: post.id, liked: post.likedByMe })}
          onBookmark={() => bookmark.mutate({ postId: post.id, bookmarked: post.bookmarkedByMe })}
          onReport={(reason) => report.mutate({ postId: post.id, reason })}
          onDelete={() => remove.mutate(post.id)} />
      ) : (
        <div className="h-28 animate-pulse rounded-2xl bg-softgray/50" />
      )}

      <h2 className="mb-2 mt-5 font-bold">Komentar</h2>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-softgray/50" />)}</div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-charcoal/60">Belum ada komentar.</p>
      ) : (
        <div className="space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="rounded-xl border border-softgray bg-cream-card p-3 text-sm">
              <span className="font-semibold">{c.username}</span>
              <p className="mt-0.5 text-charcoal/90">{c.content}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Tulis komentar…" className="flex-1 rounded-full border border-softgray bg-white px-4 py-2 text-sm" />
        <button type="submit" disabled={!text.trim() || add.isPending} className="flex h-9 w-9 items-center justify-center rounded-full bg-maroon text-white disabled:opacity-40" aria-label="Kirim komentar"><Send size={16} /></button>
      </form>
    </div>
  )
}
