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

// ============================================================
// DAFTAR INSTRUMEN. Untuk menambah: tambahkan satu baris di array SYMBOLS di bawah.
//   id       = nama tampil & alamat halaman (/market/ID)
//   tv       = kode simbol TradingView (format BURSA:SIMBOL)
//   provider = kode di Twelve Data (hanya dipakai panel Analysis; boleh meleset untuk indeks/komoditas)
// ============================================================
export type Category = 'GOLD' | 'FOREX' | 'CRYPTO' | 'INDEX' | 'KOMODITAS'
export interface SymbolDef { id: string; provider: string; tv: string; name: string; category: Category }

export const CATEGORY_LABEL: Record<Category, string> = {
  GOLD: 'GOLD & LOGAM', FOREX: 'FOREX', CRYPTO: 'CRYPTO', INDEX: 'INDEX', KOMODITAS: 'KOMODITAS'
}

const CUR: Record<string, string> = {
  EUR: 'Euro', GBP: 'British Pound', USD: 'US Dollar', JPY: 'Japanese Yen', CHF: 'Swiss Franc',
  AUD: 'Australian Dollar', CAD: 'Canadian Dollar', NZD: 'New Zealand Dollar',
  SGD: 'Singapore Dollar', IDR: 'Indonesian Rupiah'
}
const fx = (id: string, tv = `OANDA:${id}`): SymbolDef => ({
  id, tv, provider: `${id.slice(0, 3)}/${id.slice(3)}`, category: 'FOREX',
  name: `${CUR[id.slice(0, 3)]} / ${CUR[id.slice(3)]}`
})
const crypto = (id: string, tv: string, name: string): SymbolDef => ({
  id, tv, name, provider: `${id.slice(0, -3)}/USD`, category: 'CRYPTO'
})

export const SYMBOLS: SymbolDef[] = [
  // Gold & logam
  { id: 'XAUUSD', tv: 'OANDA:XAUUSD', provider: 'XAU/USD', name: 'Gold / US Dollar', category: 'GOLD' },
  { id: 'XAGUSD', tv: 'OANDA:XAGUSD', provider: 'XAG/USD', name: 'Silver / US Dollar', category: 'GOLD' },
  { id: 'XPTUSD', tv: 'OANDA:XPTUSD', provider: 'XPT/USD', name: 'Platinum / US Dollar', category: 'GOLD' },
  // Forex major
  fx('EURUSD'), fx('GBPUSD'), fx('USDJPY'), fx('USDCHF'), fx('AUDUSD'), fx('USDCAD'), fx('NZDUSD'),
  // Forex cross & minor
  fx('EURGBP'), fx('EURJPY'), fx('EURCHF'), fx('EURAUD'), fx('EURCAD'), fx('EURNZD'),
  fx('GBPJPY'), fx('GBPCHF'), fx('GBPAUD'), fx('GBPCAD'), fx('GBPNZD'),
  fx('AUDJPY'), fx('AUDCAD'), fx('AUDCHF'), fx('AUDNZD'),
  fx('CADJPY'), fx('CADCHF'), fx('CHFJPY'), fx('NZDJPY'), fx('USDSGD'),
  fx('USDIDR', 'FX_IDC:USDIDR'),
  // Crypto
  crypto('BTCUSD', 'COINBASE:BTCUSD', 'Bitcoin / US Dollar'),
  crypto('ETHUSD', 'COINBASE:ETHUSD', 'Ethereum / US Dollar'),
  crypto('SOLUSD', 'COINBASE:SOLUSD', 'Solana / US Dollar'),
  crypto('XRPUSD', 'BITSTAMP:XRPUSD', 'XRP / US Dollar'),
  crypto('BNBUSD', 'BINANCE:BNBUSDT', 'BNB / Tether'),
  crypto('DOGEUSD', 'COINBASE:DOGEUSD', 'Dogecoin / US Dollar'),
  crypto('ADAUSD', 'COINBASE:ADAUSD', 'Cardano / US Dollar'),
  crypto('LTCUSD', 'COINBASE:LTCUSD', 'Litecoin / US Dollar'),
  // Komoditas
  { id: 'USOIL', tv: 'TVC:USOIL', provider: 'WTI/USD', name: 'WTI Crude Oil', category: 'KOMODITAS' },
  { id: 'UKOIL', tv: 'TVC:UKOIL', provider: 'BRENT/USD', name: 'Brent Crude Oil', category: 'KOMODITAS' },
  { id: 'NATGAS', tv: 'OANDA:NATGASUSD', provider: 'NG/USD', name: 'Natural Gas', category: 'KOMODITAS' },
  // Indeks
  { id: 'DXY', tv: 'TVC:DXY', provider: 'DXY', name: 'US Dollar Index', category: 'INDEX' },
  { id: 'US500', tv: 'FOREXCOM:SPXUSD', provider: 'SPX', name: 'S&P 500', category: 'INDEX' },
  { id: 'US100', tv: 'FOREXCOM:NSXUSD', provider: 'NDX', name: 'Nasdaq 100', category: 'INDEX' },
  { id: 'US30', tv: 'FOREXCOM:DJI', provider: 'DJI', name: 'Dow Jones 30', category: 'INDEX' },
  { id: 'DE40', tv: 'INDEX:DEU40', provider: 'DAX', name: 'DAX 40 (Jerman)', category: 'INDEX' },
  { id: 'UK100', tv: 'FOREXCOM:UKXGBP', provider: 'FTSE', name: 'FTSE 100 (Inggris)', category: 'INDEX' },
  { id: 'JP225', tv: 'INDEX:NKY', provider: 'N225', name: 'Nikkei 225 (Jepang)', category: 'INDEX' }
]

export const providerSymbol = (id: string) => SYMBOLS.find((s) => s.id === id)?.provider ?? id
export const symbolName = (id: string) => SYMBOLS.find((s) => s.id === id)?.name ?? id
// Simbol yang tidak ada di daftar tetap dicoba sebagai OANDA:ID, atau dipakai apa adanya kalau sudah berformat BURSA:SIMBOL.
export const tradingViewSymbol = (id: string) =>
  SYMBOLS.find((s) => s.id === id)?.tv ?? (id.includes(':') ? id : `OANDA:${id}`)
