import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const HAS_SUPABASE = Boolean(url && anonKey)

// Jika env belum diisi, buat client dengan nilai placeholder agar aplikasi
// tidak crash saat import. Semua pemanggilan akan gagal dengan jelas
// (ditangani via HAS_SUPABASE di context/hooks), bukan diam-diam memakai data palsu.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key'
)
