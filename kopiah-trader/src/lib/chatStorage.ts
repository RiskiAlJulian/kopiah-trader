// Riwayat chat AI disimpan di browser (per akun), jadi tidak hilang saat halaman di-refresh.
// Hanya teks yang disimpan. Gambar tidak disimpan (terlalu besar); pesan bergambar diberi penanda.

export interface StoredMsg {
  role: 'user' | 'ai'
  text: string
  relatedLessonId?: string
  error?: boolean
  notice?: string
  hadImage?: boolean
}

const PREFIX = 'kt_ai_chat_v1:'
const MAX_STORED = 60
const MAX_TEXT = 8000

const keyFor = (userId: string | null | undefined) => `${PREFIX}${userId ?? 'guest'}`

export function loadChat(userId: string | null | undefined): StoredMsg[] {
  try {
    const raw = localStorage.getItem(keyFor(userId))
    const parsed = raw ? JSON.parse(raw) : null
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((m) => m && (m.role === 'user' || m.role === 'ai') && typeof m.text === 'string')
      .map((m): StoredMsg => ({
        role: m.role, text: m.text.slice(0, MAX_TEXT),
        relatedLessonId: typeof m.relatedLessonId === 'string' ? m.relatedLessonId : undefined,
        error: m.error === true || undefined,
        notice: typeof m.notice === 'string' ? m.notice : undefined,
        hadImage: m.hadImage === true || undefined
      }))
      .slice(-MAX_STORED)
  } catch { return [] }
}

export function saveChat(userId: string | null | undefined, msgs: StoredMsg[]) {
  try {
    if (msgs.length === 0) { localStorage.removeItem(keyFor(userId)); return }
    localStorage.setItem(keyFor(userId), JSON.stringify(msgs.slice(-MAX_STORED).map((m) => ({ ...m, text: m.text.slice(0, MAX_TEXT) }))))
  } catch { /* penyimpanan penuh atau diblokir: abaikan, chat tetap jalan */ }
}
