/** Ambil ID video dari berbagai format link YouTube. Return null kalau tidak dikenali. */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/
  ]
  for (const re of patterns) {
    const m = url.match(re)
    if (m) return m[1]
  }
  return null
}

/** Ambil ID numerik video dari link TikTok. Return null kalau tidak dikenali. */
export function extractTikTokId(url: string): string | null {
  const m = url.match(/video\/(\d+)/)
  return m ? m[1] : null
}
