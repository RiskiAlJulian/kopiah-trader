export type VideoPlatform = 'youtube' | 'tiktok'
export type VideoCategory = 'Edukasi' | 'Lainnya'

export interface VideoItem {
  id: string          // id unik bebas, mis. 'vid-1'
  title: string
  category: VideoCategory
  platform: VideoPlatform
  url: string          // paste link biasa dari YouTube/TikTok, apa adanya
}
