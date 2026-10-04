// Interval auto-refresh (ms). Free tier Twelve Data: ~8 request/menit.
// Halaman Market menampilkan 5 simbol sekaligus (5 request tiap siklus),
// jadi 45 detik ≈ 6.7 request/menit — masih di bawah limit dengan jarak aman.
// JANGAN turunkan di bawah 40 detik kalau halaman Market tetap menampilkan 5 simbol.
export const MARKET_REFRESH_INTERVAL = 45_000
// Data dianggap STALE jika lebih tua dari ini saat market buka.
// Dinaikkan dari 5 ke 10 menit karena provider gratis tidak selalu tick tiap detik
// saat likuiditas rendah — 5 menit terlalu sensitif dan sering salah tandai data basi.
export const STALE_AFTER_MS = 10 * 60_000
export const DEFAULT_INTERVAL = '15M' as const
export const HAS_KEY = Boolean(import.meta.env.VITE_TWELVE_DATA_API_KEY)
export const HAS_NEWS_KEY = Boolean(import.meta.env.VITE_FMP_API_KEY)
// Calendar tidak berubah tiap detik; refresh lebih jarang dari harga.
export const NEWS_REFRESH_INTERVAL = 5 * 60_000
export const SYMBOLS = [
  { id: 'XAUUSD', provider: 'XAU/USD', name: 'Gold / US Dollar', category: 'GOLD' },
  { id: 'EURUSD', provider: 'EUR/USD', name: 'Euro / US Dollar', category: 'FOREX' },
  { id: 'GBPUSD', provider: 'GBP/USD', name: 'British Pound / US Dollar', category: 'FOREX' },
  { id: 'USDJPY', provider: 'USD/JPY', name: 'US Dollar / Japanese Yen', category: 'FOREX' },
  { id: 'BTCUSD', provider: 'BTC/USD', name: 'Bitcoin / US Dollar', category: 'CRYPTO' }
] as const
export const providerSymbol = (id: string) => SYMBOLS.find((s) => s.id === id)?.provider ?? id
export const symbolName = (id: string) => SYMBOLS.find((s) => s.id === id)?.name ?? id
