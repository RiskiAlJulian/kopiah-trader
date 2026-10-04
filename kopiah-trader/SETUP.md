# KOPIAH TRADER — Checklist Setup

Centang manual (ganti `[ ]` jadi `[x]`) sambil jalan.

## 1. Isi file `.env`

- [ ] Copy `.env.example` jadi `.env` (di root project, sejajar dengan `package.json`)
- [ ] Nanti isi 4 baris di file ini setelah dapat key dari langkah 2–4 di bawah:
  ```
  VITE_TWELVE_DATA_API_KEY=
  VITE_FMP_API_KEY=
  VITE_SUPABASE_URL=
  VITE_SUPABASE_ANON_KEY=
  ```

## 2. Twelve Data (harga XAUUSD & chart candlestick)

- [ ] Daftar gratis di https://twelvedata.com
- [ ] Buka dashboard → copy API key
- [ ] Tempel ke `VITE_TWELVE_DATA_API_KEY` di `.env`

## 3. Financial Modeling Prep (Economic Calendar / News)

- [ ] Daftar gratis di https://financialmodelingprep.com
- [ ] Buka dashboard → copy API key
- [ ] Tempel ke `VITE_FMP_API_KEY` di `.env`

## 4. Supabase (Login, Academy, Journal, Community)

- [ ] Buat project baru di https://supabase.com (kalau belum ada)
- [ ] Buka **Project Settings → API**
  - [ ] Copy **Project URL** → tempel ke `VITE_SUPABASE_URL`
  - [ ] Copy **anon public key** → tempel ke `VITE_SUPABASE_ANON_KEY`
- [ ] Buka **SQL Editor → New query**
  - [ ] Paste seluruh isi file `supabase/schema.sql` dari project ini
  - [ ] Klik **Run** (aman dijalankan ulang kalau perlu)
- [ ] Buka **Authentication → Providers** → pastikan **Email** aktif
- [ ] (Opsional, buat testing cepat) **Authentication → Settings** → matikan **Confirm email** supaya tidak perlu verifikasi email dulu
- [ ] Buka **Storage** → pastikan bucket `journal-screenshots` sudah muncul otomatis (dibuat oleh schema.sql)

## 5. Jadwal Live Trade (opsional)

- [ ] Buka `src/data/live.ts`
- [ ] Isi `LIVE_URL` dengan link TikTok/YouTube live kamu
- [ ] Ganti `'Jadwal belum diatur'` di `LIVE_SCHEDULE` dengan jam asli tiap hari

## 6. Jalankan aplikasi

- [ ] Di terminal VS Code: `npm install`
- [ ] Lalu: `npm run dev`
- [ ] Buka link yang muncul di browser (biasanya `http://localhost:5173`)

## 7. Tes menyeluruh

- [ ] Harga XAUUSD di Home tampil dengan lencana 🟢 REAL MARKET DATA (bukan 🟡 API belum dikonfigurasi)
- [ ] Chart candlestick di halaman Market → XAUUSD bisa zoom/pan dan ganti timeframe
- [ ] Daftar akun baru lewat halaman Login
- [ ] Academy: buka satu materi, isi quiz, skor tersimpan (refresh halaman, skor masih ada)
- [ ] Journal: tambah 1 trade lengkap dengan screenshot before/after, cek muncul di daftar
- [ ] Community: buat 1 post, like, comment, bookmark
- [ ] News: pilih preset Hari Ini/Minggu Ini, cek data event muncul
- [ ] Profile: ubah username, cek Academy Progress & Win Rate muncul benar
- [ ] Coba buka di HP dan laptop dengan akun yang sama → data (Journal, Academy, Community) harus sama di kedua perangkat

## Kalau ada yang gagal

- Cek tab **Network** di DevTools browser (F12) → lihat request mana yang merah/gagal
- Cek pesan error di halaman (aplikasi ini sengaja menampilkan pesan jelas, bukan data palsu, kalau API/Supabase gagal)
- Untuk error Supabase, cek juga **Logs** di dashboard Supabase project kamu
