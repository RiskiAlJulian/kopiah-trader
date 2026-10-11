# Catatan Versi

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
