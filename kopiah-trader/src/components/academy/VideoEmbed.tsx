import { extractTikTokId, extractYouTubeId } from '../../utils/video'
import type { VideoItem } from '../../types/video'

export default function VideoEmbed({ video }: { video: VideoItem }) {
  if (video.platform === 'youtube') {
    const id = extractYouTubeId(video.url)
    if (!id) return <BrokenLink title={video.title} />
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${id}`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    )
  }

  // TikTok: portrait, lebar dibatasi supaya tidak terlalu tinggi di layar.
  const id = extractTikTokId(video.url)
  if (!id) return <BrokenLink title={video.title} />
  return (
    <div className="mx-auto aspect-[9/16] w-full max-w-[280px] overflow-hidden rounded-xl bg-black">
      <iframe
        className="h-full w-full"
        src={`https://www.tiktok.com/embed/v2/${id}`}
        title={video.title}
        allow="encrypted-media; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  )
}

function BrokenLink({ title }: { title: string }) {
  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-softgray/40 p-4 text-center text-sm text-charcoal/60">
      Link video "{title}" tidak dikenali. Pastikan link di src/data/videos.ts adalah link share biasa dari YouTube/TikTok.
    </div>
  )
}
