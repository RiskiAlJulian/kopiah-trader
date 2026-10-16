-- ============================================================
-- KOPIAH TRADER ANALIS — Jurnal sinyal otomatis (permanen, tidak bisa diubah)
-- Jalankan di Supabase Dashboard > SQL Editor > New query
-- Aman dijalankan berulang.
--
-- Desain:
--  * Pengguna (anon/authenticated) HANYA boleh membaca. Tidak ada kebijakan tulis.
--  * Yang menulis hanya server (api/analyst-run.js) memakai service_role key.
--  * Dua tabel bersifat append-only: trigger menolak UPDATE, DELETE, dan TRUNCATE
--    untuk SIAPA PUN (termasuk service_role). Hasil sinyal (TP/SL) dicatat sebagai
--    baris event baru, bukan dengan mengubah baris sinyal.
--  * Catatan jujur: pemilik project yang punya akses SQL Editor masih bisa
--    menghapus trigger ini secara sengaja. Perlindungan ini untuk kode aplikasi
--    dan semua pengguna, bukan untuk admin database.
-- ============================================================

create table if not exists public.analyst_signals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  symbol text not null,
  timeframe text not null,
  direction text not null check (direction in ('buy', 'sell')),
  stage text not null check (stage in ('fib_0705', 'fib_0796')),
  leg_key text not null,                 -- identitas leg fibonacci: arah:waktu-swing-1:waktu-swing-2
  swing_high numeric not null,
  swing_low numeric not null,
  swing_high_time timestamptz not null,
  swing_low_time timestamptz not null,
  fib_level numeric not null,            -- level fib tempat entry (0.705 atau 0.796)
  entry_time timestamptz not null,       -- waktu candle yang menyentuh level entry
  entry numeric not null,
  sl numeric not null,
  tp1 numeric not null,
  tp2 numeric not null,
  tp3 numeric not null,
  sl_pips numeric not null,
  reason text not null,
  unique (leg_key, stage)                -- mencegah sinyal ganda untuk leg dan tahap yang sama
);
create index if not exists analyst_signals_entry_time_idx on public.analyst_signals (entry_time desc);

create table if not exists public.analyst_signal_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  signal_id uuid not null references public.analyst_signals (id),
  type text not null check (type in ('TP1', 'TP2', 'TP3', 'SL', 'CLOSED', 'EXPIRED')),
  price numeric,
  event_time timestamptz not null,       -- waktu candle yang menyentuh level
  unique (signal_id, type)
);
create index if not exists analyst_signal_events_signal_idx on public.analyst_signal_events (signal_id);

-- ---- Append-only: tolak ubah/hapus untuk siapa pun ----
create or replace function public.analyst_block_changes()
returns trigger as $$
begin
  raise exception 'Jurnal KOPIAH TRADER ANALIS bersifat permanen: % pada % tidak diizinkan', tg_op, tg_table_name;
end;
$$ language plpgsql;

drop trigger if exists analyst_signals_no_update_delete on public.analyst_signals;
create trigger analyst_signals_no_update_delete
  before update or delete on public.analyst_signals
  for each row execute function public.analyst_block_changes();
drop trigger if exists analyst_signals_no_truncate on public.analyst_signals;
create trigger analyst_signals_no_truncate
  before truncate on public.analyst_signals
  for each statement execute function public.analyst_block_changes();

drop trigger if exists analyst_events_no_update_delete on public.analyst_signal_events;
create trigger analyst_events_no_update_delete
  before update or delete on public.analyst_signal_events
  for each row execute function public.analyst_block_changes();
drop trigger if exists analyst_events_no_truncate on public.analyst_signal_events;
create trigger analyst_events_no_truncate
  before truncate on public.analyst_signal_events
  for each statement execute function public.analyst_block_changes();

-- ---- Hak akses: baca saja untuk pengguna ----
alter table public.analyst_signals enable row level security;
alter table public.analyst_signal_events enable row level security;

revoke all on public.analyst_signals from anon, authenticated;
revoke all on public.analyst_signal_events from anon, authenticated;
grant select on public.analyst_signals to anon, authenticated;
grant select on public.analyst_signal_events to anon, authenticated;

-- Dibuka untuk umum karena sinyal tampil di halaman Market yang bisa dibuka tanpa login.
-- Untuk membatasi hanya pengguna login, ganti "anon, authenticated" menjadi "authenticated".
drop policy if exists "analyst_signals read" on public.analyst_signals;
create policy "analyst_signals read" on public.analyst_signals
  for select to anon, authenticated using (true);
drop policy if exists "analyst_events read" on public.analyst_signal_events;
create policy "analyst_events read" on public.analyst_signal_events
  for select to anon, authenticated using (true);
