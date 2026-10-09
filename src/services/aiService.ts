import { MATERIALS } from '../data/academy'
import { supabase } from '../lib/supabaseClient'
import type { Material } from '../types/academy'

export interface ChatMessage { role: 'user' | 'assistant'; content: string }
export interface AIAnswer {
  answer: string
  relatedLessonId?: string
  /** llm = dijawab model AI; local = dari materi Academy (cadangan); error = pesan gangguan */
  source: 'llm' | 'local' | 'error'
  notice?: string
}

export interface AIProvider { ask(history: ChatMessage[]): Promise<AIAnswer> }

class AIServerError extends Error {
  constructor(public status: number, public code: string) { super(code) }
}

/** Memanggil fungsi server /api/chat (api/chat.js) yang memegang API key model AI. */
class ServerLLMProvider implements AIProvider {
  async ask(history: ChatMessage[]): Promise<AIAnswer> {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    let res: Response
    try {
      res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ messages: history.slice(-12) })
      })
    } catch {
      throw new AIServerError(0, 'network')
    }
    const body = await res.json().catch(() => null)
    if (!res.ok) throw new AIServerError(res.status, body?.error ?? 'error')
    if (!body || typeof body.answer !== 'string') throw new AIServerError(0, 'bad_response')
    return { answer: body.answer, source: 'llm' }
  }
}

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s]/g, ' ')

// Kata umum yang tidak membantu mencari materi.
const STOP = new Set([
  'apa', 'itu', 'yang', 'dan', 'atau', 'untuk', 'dengan', 'dari', 'pada', 'ini', 'adalah', 'cara', 'jelaskan', 'jelasin',
  'bagaimana', 'gimana', 'kenapa', 'mengapa', 'bisa', 'buat', 'buatkan', 'tolong', 'saya', 'aku', 'kamu', 'dong', 'sih',
  'apakah', 'tentang', 'arti', 'maksud', 'pengertian', 'contoh', 'hallo', 'halo'
])

/** Kata yang cocok dengan judul materi bernilai jauh lebih tinggi daripada yang cuma muncul di isi. */
function score(material: Material, q: string): number {
  const words = norm(q).split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w))
  const title = norm(`${material.title} ${material.id}`)
  const titleWords = title.split(/\s+/)
  const bodyWords = new Set(norm(`${material.description} ${material.content.join(' ')}`).split(/\s+/))
  return words.reduce(
    (s, w) => s + (titleWords.includes(w) ? 5 : w.length >= 4 && title.includes(w) ? 3 : 0) + (bodyWords.has(w) ? 1 : 0),
    0
  )
}

/** Cadangan saat AI umum belum tersambung: menjawab dari materi KOPIAH TRADER ACADEMY. */
class LocalKnowledgeProvider implements AIProvider {
  async ask(history: ChatMessage[]): Promise<AIAnswer> {
    const q = [...history].reverse().find((m) => m.role === 'user')?.content.trim() ?? ''
    if (!q) return { answer: 'Silakan ketik pertanyaanmu.', source: 'local' }

    const best = MATERIALS.map((m) => ({ m, s: score(m, q) })).sort((a, b) => b.s - a.s)[0]
    if (!best || best.s < 2) {
      return {
        answer: 'Aku belum menemukan materi yang cocok untuk pertanyaan ini di KOPIAH TRADER ACADEMY. Coba tanyakan istilah trading seperti BOS, CHOCH, FVG, Order Block, Liquidity, Risk Management, atau Market Structure.',
        source: 'local'
      }
    }
    const { m } = best
    return {
      answer: `${m.description}\n\n${m.content.join(' ')}\n\nIni ringkasan edukasi, bukan sinyal atau saran trading. Selalu terapkan Risk Management.`,
      relatedLessonId: m.id,
      source: 'local'
    }
  }
}

const remote = new ServerLLMProvider()
const local = new LocalKnowledgeProvider()

export const aiService = {
  /** Tidak pernah melempar error: selalu mengembalikan jawaban atau pesan yang bisa ditampilkan. */
  async ask(history: ChatMessage[]): Promise<AIAnswer> {
    try {
      return await remote.ask(history)
    } catch (e) {
      if (e instanceof AIServerError) {
        if (e.status === 429) return { answer: 'AI sedang mencapai batas penggunaan. Tunggu sebentar lalu coba lagi.', source: 'error' }
        if (e.status === 401) return { answer: 'Sesi login kamu sudah habis. Silakan keluar lalu masuk lagi.', source: 'error' }
        if (e.status === 502) return { answer: 'AI sedang bermasalah. Coba lagi sebentar lagi.', source: 'error' }
      }
      // Belum dikonfigurasi (503), halaman /api tidak ada (mis. saat npm run dev), atau tidak ada jaringan.
      const fallback = await local.ask(history)
      return { ...fallback, notice: 'AI umum belum tersambung, jawaban ini dari materi Academy.' }
    }
  }
}
