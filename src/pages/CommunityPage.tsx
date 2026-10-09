import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { usePosts } from '../hooks/useCommunity'
import PostCard from '../components/community/PostCard'
import { CATEGORIES, type PostCategory } from '../types/community'

function SkeletonList() {
  return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-softgray/50" />)}</div>
}

function NewPostForm({ onClose, onSubmit, saving }: { onClose: () => void; onSubmit: (c: PostCategory, text: string) => void; saving: boolean }) {
  const [category, setCategory] = useState<PostCategory>('General')
  const [content, setContent] = useState('')
  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 sm:items-center sm:p-4">
      <div className="w-full max-w-lg rounded-t-2xl bg-cream-card p-5 sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Buat Post</h2>
          <button onClick={onClose} aria-label="Tutup"><X size={20} /></button>
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value as PostCategory)} className="w-full rounded-lg border border-softgray bg-white px-3 py-2 text-sm">
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} placeholder="Bagikan analisis, progres, atau pertanyaan kamu…"
          className="mt-3 w-full rounded-lg border border-softgray bg-white px-3 py-2 text-sm" />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-full border border-softgray px-4 py-2 text-sm font-semibold">Batal</button>
          <button onClick={() => onSubmit(category, content)} disabled={!content.trim() || saving} className="rounded-full bg-maroon px-5 py-2 text-sm font-semibold text-white disabled:opacity-40">
            {saving ? 'Mengirim…' : 'Posting'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CommunityPage() {
  const { user } = useAuth()
  const [category, setCategory] = useState<PostCategory | 'ALL'>('ALL')
  const { posts, isLoading, isError, refetch, create, remove, like, bookmark, report } = usePosts(category === 'ALL' ? undefined : category)
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">KOPIAH TRADER HUB</h1>
          <p className="text-sm text-charcoal/60">Diskusi, analisis, dan progres belajar bersama komunitas.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-full bg-maroon px-4 py-2 text-sm font-semibold text-white"><Plus size={16} />Post</button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['ALL', ...CATEGORIES] as const).map((c) => (
          <button key={c} onClick={() => setCategory(c)} className={`rounded-full px-3 py-1 text-sm font-semibold ${category === c ? 'bg-maroon text-white' : 'bg-softgray/50'}`}>{c}</button>
        ))}
      </div>

      {isError && (
        <div className="flex items-center justify-between rounded-lg bg-red-50 p-3 text-sm text-maroon">
          <span>Gagal memuat post.</span><button onClick={() => refetch()} className="font-semibold underline">Coba lagi</button>
        </div>
      )}

      {isLoading ? <SkeletonList /> : posts.length === 0 ? (
        <p className="rounded-2xl border border-softgray bg-cream-card p-5 text-charcoal/70">Belum ada post di kategori ini.</p>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} currentUserId={user?.id}
              onLike={() => like.mutate({ postId: p.id, liked: p.likedByMe })}
              onBookmark={() => bookmark.mutate({ postId: p.id, bookmarked: p.bookmarkedByMe })}
              onReport={(reason) => report.mutate({ postId: p.id, reason })}
              onDelete={() => remove.mutate(p.id)} />
          ))}
        </div>
      )}

      {showForm && (
        <NewPostForm saving={create.isPending} onClose={() => setShowForm(false)}
          onSubmit={(cat, text) => create.mutate({ category: cat, content: text }, { onSuccess: () => setShowForm(false) })} />
      )}
    </div>
  )
}
