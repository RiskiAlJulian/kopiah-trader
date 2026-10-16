# Catatan Versi

## 2026-10-16
- News: sumber kalender diganti dari FMP (butuh plan berbayar, HTTP 402) ke feed gratis Forex Factory lewat `api/calendar.js`. Tidak perlu API key. Hanya minggu berjalan, ada forecast dan previous, tanpa nilai actual. Ditambah kolom cari berita (CPI, PPI, NFP)
- Login: fitur Lupa password (tautan reset lewat email, halaman `/reset-password`)
- Keamanan: key Twelve Data dipindah ke fungsi server (`api/market.js`, `api/calendar.js`); tidak lagi ikut ke browser. Variabel baru: `TWELVE_DATA_API_KEY`, `FMP_API_KEY` (tanpa `VITE_`). Respons di-cache di CDN Vercel sehingga kuota lebih hemat

## 2026-10-13
- Academy: 120 soal bertingkat (8 per materi: 2 soal tiap tingkat Pemula, Menengah, Mahir, Profesional & Analis), lengkap dengan penjelasan jawaban
- Academy: Tantangan Level (10 soal acak per tingkat, lulus 70% untuk membuka level berikutnya) dan gelar (Calon Trader sampai Analis Profesional)
- Profile: gelar mengikuti level yang lulus; "Materi lulus" dihitung dari kuis baru
- Hasil kuis lama (1 soal) tidak lagi dihitung; tidak perlu perubahan database

## 2026-10-11
- AI: model default diganti ke `gemini-3.8-flash` (2.5-flash dipensiunkan Google untuk pengguna baru)
- AI: bila satu model gagal/kena batas, otomatis mencoba model cadangan (3.8 → 3.7 → 3.5-flash-lite → 3.1-flash-lite); tanpa parameter temperature
- AI: pesan error kini menampilkan "Detail teknis" (status tiap model) di bawah balasan, untuk memudahkan diagnosis

## 2026-10-10 — versi lengkap terbaru
- AI umum lewat fungsi server (`api/chat.js`), cadangan dari materi Academy bila belum tersambung
- Home baru: tagline sebagai menu, pita harga TradingView, blok Gold dan Live
- Splash screen animasi saat membuka aplikasi
- 49 instrumen di Market dengan pencarian dan kategori; chart TradingView + tombol Layar Penuh/Lanskap
- Menu HP lengkap (tombol Menu berisi Live Trade, News, Calculator, AI, Community)
- Perbaikan 404 saat refresh (`vercel.json`)
- Sebelumnya: Academy, Journal (Supabase + Storage), Community, Profile, Economic Calendar, Live, Calculator
