import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, Flag, Heart, MessageCircle, Trash2 } from 'lucide-react'
import type { Post } from '../../types/community'

const timeAgo = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'baru saja'
  if (s < 3600) return `${Math.floor(s / 60)}m lalu`
  if (s < 86400) return `${Math.floor(s / 3600)}j lalu`
  return `${Math.floor(s / 86400)}h lalu`
}

export default function PostCard({
  post, currentUserId, onLike, onBookmark, onReport, onDelete
}: {
  post: Post; currentUserId?: string
  onLike: () => void; onBookmark: () => void; onReport: (reason: string) => void; onDelete: () => void
}) {
  const [showReport, setShowReport] = useState(false)
  const [reason, setReason] = useState('')
  const isMine = post.userId === currentUserId

  return (
    <div className="rounded-2xl border border-softgray bg-cream-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold">{post.username}</span>
          <span className="rounded-full bg-softgray/60 px-2 py-0.5 text-[11px] font-semibold">{post.category}</span>
        </div>
        <span className="text-xs text-charcoal/50">{timeAgo(post.createdAt)}</span>
      </div>
      <p className="mt-2 whitespace-pre-line text-sm text-charcoal/90">{post.content}</p>
      <div className="mt-3 flex items-center gap-4 text-sm text-charcoal/60">
        <button onClick={onLike} className={`flex items-center gap-1 ${post.likedByMe ? 'font-semibold text-maroon' : ''}`}>
          <Heart size={16} className={post.likedByMe ? 'fill-maroon text-maroon' : ''} /> {post.likeCount}
        </button>
        <Link to={`/community/${post.id}`} className="flex items-center gap-1"><MessageCircle size={16} /> {post.commentCount}</Link>
        <button onClick={onBookmark} className={post.bookmarkedByMe ? 'text-maroon' : ''}><Bookmark size={16} className={post.bookmarkedByMe ? 'fill-maroon' : ''} /></button>
        {isMine ? (
          <button onClick={onDelete} className="ml-auto flex items-center gap-1 text-charcoal/50 hover:text-maroon"><Trash2 size={14} />Hapus</button>
        ) : (
          <button onClick={() => setShowReport((s) => !s)} className="ml-auto flex items-center gap-1 text-charcoal/50 hover:text-maroon"><Flag size={14} />Report</button>
        )}
      </div>
      {showReport && (
        <div className="mt-2 flex gap-2">
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Alasan report (opsional)"
            className="flex-1 rounded-lg border border-softgray bg-white px-3 py-1.5 text-sm" />
          <button onClick={() => { onReport(reason); setShowReport(false); setReason('') }} className="rounded-lg bg-maroon px-3 py-1.5 text-sm font-semibold text-white">Kirim</button>
        </div>
      )}
    </div>
  )
}
