export const SOCIAL_LINKS = {
  tiktok: 'https://www.tiktok.com/@kopiahtrader',
  youtube: 'https://www.youtube.com/@KopiahTrader',
  instagram: 'https://www.instagram.com/riskialjulian_24'
}

export const LIVE_SCHEDULE: { day: string; time: string; platform: keyof typeof SOCIAL_LINKS | null }[] = [
  { day: 'Senin', time: '19.30 WIB', platform: 'tiktok' },
  { day: 'Selasa', time: '19.30 WIB', platform: 'tiktok' },
  { day: 'Rabu', time: '19.30 WIB', platform: 'tiktok' },
  { day: 'Kamis', time: '19.30 WIB', platform: 'tiktok' },
  { day: 'Jumat', time: '19.30 WIB', platform: 'tiktok' }
]