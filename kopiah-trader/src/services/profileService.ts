import { supabase } from '../lib/supabaseClient'
import type { Profile } from '../types/profile'

interface Row { user_id: string; username: string; trader_level: string; avatar_url: string | null }
const toProfile = (r: Row): Profile => ({ userId: r.user_id, username: r.username, traderLevel: r.trader_level, avatarUrl: r.avatar_url })

export async function fetchProfile(userId: string, fallbackUsername: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw error
  if (data) return toProfile(data as Row)
  // Baris belum ada (trigger belum sempat jalan) -> buat sekarang.
  const { data: created, error: insertError } = await supabase
    .from('profiles').insert({ user_id: userId, username: fallbackUsername }).select().single()
  if (insertError) throw insertError
  return toProfile(created as Row)
}

export async function updateProfile(userId: string, patch: { username?: string; traderLevel?: string }): Promise<void> {
  const { error } = await supabase.from('profiles').update({
    ...(patch.username !== undefined ? { username: patch.username } : {}),
    ...(patch.traderLevel !== undefined ? { trader_level: patch.traderLevel } : {})
  }).eq('user_id', userId)
  if (error) throw error
}

/** Ambil banyak profil sekaligus untuk ditampilkan sebagai nama penulis post/komentar. */
export async function fetchUsernames(userIds: string[]): Promise<Record<string, string>> {
  if (userIds.length === 0) return {}
  const { data, error } = await supabase.from('profiles').select('user_id,username').in('user_id', [...new Set(userIds)])
  if (error) throw error
  const map: Record<string, string> = {}
  for (const r of data as { user_id: string; username: string }[]) map[r.user_id] = r.username
  return map
}
