import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, LogOut, NotebookPen, Settings, GraduationCap, Bell } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useJournal } from '../hooks/useJournal'
import { useAcademyProgress } from '../hooks/useAcademyProgress'
import { usePosts } from '../hooks/useCommunity'
import { MATERIALS } from '../data/academy'

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const { profile, isLoading, save } = useProfile()
  const { stats, isLoading: journalLoading } = useJournal()
  const { progress, isLoading: academyLoading } = useAcademyProgress()
  const { posts } = usePosts()
  const bookmarked = posts.filter((p) => p.bookmarkedByMe)

  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState('')

  const doneCount = Object.values(progress).filter((p) => p.done).length

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="flex items-center gap-4 rounded-2xl border border-softgray bg-cream-card p-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-maroon text-2xl font-bold text-white">
          {(profile?.username ?? user?.email ?? '?')[0]?.toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div className="h-5 w-32 animate-pulse rounded bg-softgray/60" />
          ) : editing ? (
            <div className="flex gap-2">
              <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-lg border border-softgray px-2 py-1 text-sm" />
              <button onClick={() => { save.mutate({ username }); setEditing(false) }} className="rounded-lg bg-maroon px-3 py-1 text-sm font-semibold text-white">Simpan</button>
            </div>
          ) : (
            <button onClick={() => { setUsername(profile?.username ?? ''); setEditing(true) }} className="font-bold hover:underline">{profile?.username ?? user?.email}</button>
          )}
          <p className="truncate text-xs text-charcoal/60">{user?.email}</p>
          <span className="mt-1 inline-block rounded-full bg-softgray/60 px-2 py-0.5 text-[11px] font-semibold">{profile?.traderLevel ?? 'Pemula'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-softgray bg-cream-card p-4">
          <div className="text-xs text-charcoal/50">Academy Progress</div>
          <div className="mt-1 text-xl font-bold">{academyLoading ? '…' : `${doneCount}/${MATERIALS.length}`}</div>
        </div>
        <div className="rounded-2xl border border-softgray bg-cream-card p-4">
          <div className="text-xs text-charcoal/50">Journal · Win Rate</div>
          <div className="mt-1 text-xl font-bold">{journalLoading ? '…' : `${stats.winRate.toFixed(0)}%`}</div>
        </div>
      </div>

      <div className="divide-y divide-softgray overflow-hidden rounded-2xl border border-softgray bg-cream-card">
        <Link to="/journal" className="flex items-center gap-3 p-4 text-sm font-medium hover:bg-softgray/30"><NotebookPen size={18} />My Journal</Link>
        <Link to="/academy" className="flex items-center gap-3 p-4 text-sm font-medium hover:bg-softgray/30"><GraduationCap size={18} />My Academy</Link>
        <div className="p-4">
          <div className="mb-2 flex items-center gap-3 text-sm font-medium"><Bookmark size={18} />Bookmarks</div>
          {bookmarked.length === 0 ? <p className="pl-7 text-xs text-charcoal/50">Belum ada post yang disimpan.</p> : (
            <ul className="space-y-1 pl-7 text-xs">
              {bookmarked.slice(0, 5).map((p) => <li key={p.id}><Link to={`/community/${p.id}`} className="text-maroon hover:underline">{p.content.slice(0, 60)}{p.content.length > 60 ? '…' : ''}</Link></li>)}
            </ul>
          )}
        </div>
        <button className="flex w-full items-center gap-3 p-4 text-left text-sm font-medium text-charcoal/50" disabled><Bell size={18} />Notifications (segera hadir)</button>
        <button className="flex w-full items-center gap-3 p-4 text-left text-sm font-medium text-charcoal/50" disabled><Settings size={18} />Settings (segera hadir)</button>
        <button onClick={() => signOut()} className="flex w-full items-center gap-3 p-4 text-left text-sm font-medium text-maroon hover:bg-red-50"><LogOut size={18} />Logout</button>
      </div>
    </div>
  )
}
