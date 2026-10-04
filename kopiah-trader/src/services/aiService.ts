import { MATERIALS } from '../data/academy'
import type { Material } from '../types/academy'

export interface AIAnswer { answer: string; relatedLessonId?: string }

/**
 * AI provider interface — sama pola dengan MarketDataProvider.
 * Ganti implementasi di sini kalau nanti mau pakai LLM asli (OpenAI/Anthropic/dll)
 * lewat backend/proxy (jangan panggil API key LLM langsung dari browser).
 */
export interface AIProvider {
  ask(question: string): Promise<AIAnswer>
}

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s]/g, ' ')

function score(material: Material, q: string): number {
  const hay = norm(`${material.title} ${material.description} ${material.content.join(' ')}`)
  const words = norm(q).split(/\s+/).filter((w) => w.length > 2)
  return words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0)
}

/**
 * Implementasi sementara: menjawab dari basis materi KOPIAH TRADER ACADEMY
 * (bukan model bahasa umum). Jujur ditandai di UI karena belum ada LLM terhubung.
 */
class LocalKnowledgeProvider implements AIProvider {
  async ask(question: string): Promise<AIAnswer> {
    const q = question.trim()
    if (!q) return { answer: 'Silakan ketik pertanyaan tentang trading, misalnya "Apa itu BOS?" atau "Bagaimana menghitung risk?".' }

    const ranked = MATERIALS.map((m) => ({ m, s: score(m, q) })).sort((a, b) => b.s - a.s)
    const best = ranked[0]

    if (!best || best.s === 0) {
      return {
        answer: 'Aku belum menemukan materi yang cocok untuk pertanyaan ini di KOPIAH TRADER ACADEMY. Coba tanyakan istilah trading seperti BOS, CHOCH, FVG, Order Block, Liquidity, Risk Management, atau Market Structure. Aku tidak bisa memberi sinyal atau janji profit — fokusku edukasi.'
      }
    }
    const { m } = best
    return { answer: `${m.description}\n\n${m.content.join(' ')}\n\nIni ringkasan edukasi, bukan sinyal atau saran trading. Selalu terapkan Risk Management.`, relatedLessonId: m.id }
  }
}

export const aiService: AIProvider = new LocalKnowledgeProvider()
