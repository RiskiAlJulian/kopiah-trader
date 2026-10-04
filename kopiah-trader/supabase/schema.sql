-- ============================================================
-- KOPIAH TRADER — Academy Progress, Trading Journal & Storage
-- Jalankan di Supabase Dashboard > SQL Editor > New query
-- Aman dijalankan berulang (pakai IF NOT EXISTS / DROP POLICY IF EXISTS)
-- ============================================================

-- Fungsi bantu: mengisi updated_at otomatis setiap UPDATE
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ------------------------------------------------------------
-- 1. TABEL: academy_progress
-- ------------------------------------------------------------
create table if not exists public.academy_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null,
  is_completed boolean not null default false,
  quiz_score integer not null default 0,
  -- Tambahan di luar spesifikasi: jumlah total soal quiz, dipakai UI untuk
  -- menampilkan "skor/total". Hapus kolom ini jika tidak diperlukan.
  quiz_total integer not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint academy_progress_user_lesson_unique unique (user_id, lesson_id)
);

drop trigger if exists trg_academy_progress_updated_at on public.academy_progress;
create trigger trg_academy_progress_updated_at
  before update on public.academy_progress
  for each row execute function public.set_updated_at();

alter table public.academy_progress enable row level security;

drop policy if exists "academy_progress_select_own" on public.academy_progress;
create policy "academy_progress_select_own" on public.academy_progress
  for select using (auth.uid() = user_id);

drop policy if exists "academy_progress_insert_own" on public.academy_progress;
create policy "academy_progress_insert_own" on public.academy_progress
  for insert with check (auth.uid() = user_id);

drop policy if exists "academy_progress_update_own" on public.academy_progress;
create policy "academy_progress_update_own" on public.academy_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "academy_progress_delete_own" on public.academy_progress;
create policy "academy_progress_delete_own" on public.academy_progress
  for delete using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 2. TABEL: trading_journals
-- Catatan: menambahkan 'OPEN' pada kolom result (selain WIN/LOSS/BE)
-- agar trade yang belum ditutup tetap bisa dicatat, sesuai fitur journal saat ini.
-- ------------------------------------------------------------
create table if not exists public.trading_journals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pair text not null,
  direction text not null check (direction in ('BUY', 'SELL')),
  entry_price numeric not null default 0,
  sl_price numeric not null default 0,
  tp_price numeric not null default 0,
  lot_size numeric not null default 0,
  risk_percentage numeric not null default 0,
  result text not null default 'OPEN' check (result in ('WIN', 'LOSS', 'BE', 'OPEN')),
  profit_loss_amount numeric not null default 0,
  trade_date date not null default current_date,
  timeframe text not null default '',
  strategy text not null default '',
  emotion text not null default '',
  entry_reason text not null default '',
  mistake text not null default '',
  notes text not null default '',
  screenshot_before_url text,
  screenshot_after_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_trading_journals_updated_at on public.trading_journals;
create trigger trg_trading_journals_updated_at
  before update on public.trading_journals
  for each row execute function public.set_updated_at();

create index if not exists trading_journals_user_id_idx on public.trading_journals (user_id);

alter table public.trading_journals enable row level security;

drop policy if exists "trading_journals_select_own" on public.trading_journals;
create policy "trading_journals_select_own" on public.trading_journals
  for select using (auth.uid() = user_id);

drop policy if exists "trading_journals_insert_own" on public.trading_journals;
create policy "trading_journals_insert_own" on public.trading_journals
  for insert with check (auth.uid() = user_id);

drop policy if exists "trading_journals_update_own" on public.trading_journals;
create policy "trading_journals_update_own" on public.trading_journals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "trading_journals_delete_own" on public.trading_journals;
create policy "trading_journals_delete_own" on public.trading_journals
  for delete using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 3. STORAGE BUCKET: journal-screenshots
-- Bucket dibuat public-read agar screenshot bisa ditampilkan lewat <img src>
-- tanpa signed URL, tapi upload/update/delete tetap dibatasi RLS per user.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('journal-screenshots', 'journal-screenshots', true)
on conflict (id) do nothing;

-- Konvensi path file: {user_id}/{namafile}. Kebijakan di bawah membaca
-- folder pertama pada path sebagai pemilik file.
drop policy if exists "journal_screenshots_select_public" on storage.objects;
create policy "journal_screenshots_select_public" on storage.objects
  for select using (bucket_id = 'journal-screenshots');

drop policy if exists "journal_screenshots_insert_own" on storage.objects;
create policy "journal_screenshots_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'journal-screenshots'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "journal_screenshots_update_own" on storage.objects;
create policy "journal_screenshots_update_own" on storage.objects
  for update using (
    bucket_id = 'journal-screenshots'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "journal_screenshots_delete_own" on storage.objects;
create policy "journal_screenshots_delete_own" on storage.objects
  for delete using (
    bucket_id = 'journal-screenshots'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- 4. PROFILES — data tambahan user (username, level trader)
-- ============================================================
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  trader_level text not null default 'Pemula',
  avatar_url text,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- Profil bisa dibaca siapa saja yang login (dipakai untuk menampilkan nama penulis post Community).
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles
  for select using (auth.role() = 'authenticated');

drop policy if exists "profiles_upsert_own" on public.profiles;
create policy "profiles_upsert_own" on public.profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Buat baris profile otomatis saat user baru mendaftar.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, username)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 5. COMMUNITY (KOPIAH TRADER HUB)
-- ============================================================
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null check (category in ('General', 'Analysis', 'Education', 'Journal', 'Discussion')),
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists community_posts_created_idx on public.community_posts (created_at desc);
alter table public.community_posts enable row level security;

drop policy if exists "community_posts_select_all" on public.community_posts;
create policy "community_posts_select_all" on public.community_posts for select using (auth.role() = 'authenticated');
drop policy if exists "community_posts_insert_own" on public.community_posts;
create policy "community_posts_insert_own" on public.community_posts for insert with check (auth.uid() = user_id);
drop policy if exists "community_posts_delete_own" on public.community_posts;
create policy "community_posts_delete_own" on public.community_posts for delete using (auth.uid() = user_id);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists community_comments_post_idx on public.community_comments (post_id);
alter table public.community_comments enable row level security;

drop policy if exists "community_comments_select_all" on public.community_comments;
create policy "community_comments_select_all" on public.community_comments for select using (auth.role() = 'authenticated');
drop policy if exists "community_comments_insert_own" on public.community_comments;
create policy "community_comments_insert_own" on public.community_comments for insert with check (auth.uid() = user_id);
drop policy if exists "community_comments_delete_own" on public.community_comments;
create policy "community_comments_delete_own" on public.community_comments for delete using (auth.uid() = user_id);

create table if not exists public.community_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint community_likes_unique unique (post_id, user_id)
);
alter table public.community_likes enable row level security;

drop policy if exists "community_likes_select_all" on public.community_likes;
create policy "community_likes_select_all" on public.community_likes for select using (auth.role() = 'authenticated');
drop policy if exists "community_likes_insert_own" on public.community_likes;
create policy "community_likes_insert_own" on public.community_likes for insert with check (auth.uid() = user_id);
drop policy if exists "community_likes_delete_own" on public.community_likes;
create policy "community_likes_delete_own" on public.community_likes for delete using (auth.uid() = user_id);

create table if not exists public.community_bookmarks (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint community_bookmarks_unique unique (post_id, user_id)
);
alter table public.community_bookmarks enable row level security;

drop policy if exists "community_bookmarks_select_own" on public.community_bookmarks;
create policy "community_bookmarks_select_own" on public.community_bookmarks for select using (auth.uid() = user_id);
drop policy if exists "community_bookmarks_insert_own" on public.community_bookmarks;
create policy "community_bookmarks_insert_own" on public.community_bookmarks for insert with check (auth.uid() = user_id);
drop policy if exists "community_bookmarks_delete_own" on public.community_bookmarks;
create policy "community_bookmarks_delete_own" on public.community_bookmarks for delete using (auth.uid() = user_id);

-- Report hanya bisa dibuat (insert), tidak ada policy select untuk user biasa
-- (ditinjau lewat Supabase Dashboard oleh admin/pemilik project).
create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reason text not null default '',
  created_at timestamptz not null default now()
);
alter table public.community_reports enable row level security;

drop policy if exists "community_reports_insert_own" on public.community_reports;
create policy "community_reports_insert_own" on public.community_reports for insert with check (auth.uid() = user_id);
