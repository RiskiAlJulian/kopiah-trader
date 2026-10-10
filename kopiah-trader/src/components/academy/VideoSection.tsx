import { useState } from 'react'
import { VIDEOS } from '../../data/videos'
import type { VideoCategory } from '../../types/video'
import VideoEmbed from './VideoEmbed'

const CATEGORIES: VideoCategory[] = ['Edukasi', 'Lainnya']

export default function VideoSection() {
  const [cat, setCat] = useState<VideoCategory>('Edukasi')
  const list = VIDEOS.filter((v) => v.category === cat)

  if (VIDEOS.length === 0) return null // tidak tampil sama sekali kalau belum ada video diisi

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold">Video</h2>
        <div className="flex gap-1.5">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${cat === c ? 'bg-maroon text-white' : 'bg-softgray/50'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <p className="rounded-2xl border border-softgray bg-cream-card p-4 text-sm text-charcoal/60">Belum ada video di kategori ini.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((v) => (
            <div key={v.id} className="rounded-2xl border border-softgray bg-cream-card p-3">
              <VideoEmbed video={v} />
              <p className="mt-2 text-sm font-semibold">{v.title}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
