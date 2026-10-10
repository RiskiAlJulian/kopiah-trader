// ============================================================
// ISI DI SINI SAJA — tidak perlu sentuh file lain untuk atur jadwal/link live.
// ============================================================

// Link akun kamu (harus URL lengkap berawalan https://).
// Kosongkan string ('') kalau belum punya — tombolnya otomatis nonaktif.
export const SOCIAL_LINKS = {
  tiktok: 'https://www.tiktok.com/@kopiahtrader',
  youtube: 'https://www.youtube.com/@KopiahTrader',
  instagram: 'https://www.instagram.com/riskialjulian_24'
}

// Jadwal live per hari. "time" bebas formatnya (mis. "19.30 WIB" atau "Libur").
// "platform" menentukan tombol WATCH LIVE memakai link yang mana:
// 'tiktok' | 'youtube' | null (null = hari itu libur).
// Instagram hanya untuk "Ikuti Kami", bukan tempat live.
export const LIVE_SCHEDULE: { day: string; time: string; platform: keyof typeof SOCIAL_LINKS | null }[] = [
  { day: 'Senin', time: '19.30 WIB', platform: 'tiktok' },
  { day: 'Selasa', time: '19.30 WIB', platform: 'tiktok' },
  { day: 'Rabu', time: '19.30 WIB', platform: 'tiktok' },
  { day: 'Kamis', time: '19.30 WIB', platform: 'tiktok' },
  { day: 'Jumat', time: '19.30 WIB', platform: 'tiktok' }
]
