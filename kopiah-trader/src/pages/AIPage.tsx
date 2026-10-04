import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Bot, Send, User as UserIcon } from 'lucide-react'
import { aiService } from '../services/aiService'

interface Msg { role: 'user' | 'ai'; text: string; relatedLessonId?: string }

const SUGGESTIONS = ['Jelaskan BOS', 'Apa itu CHOCH?', 'Apa itu FVG?', 'Bagaimana menghitung risk?', 'Jelaskan market structure.']

export default function AIPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'ai', text: 'Hai! Aku KOPIAH TRADER AI. Aku bantu jelaskan istilah dan konsep trading dari materi Academy. Aku tidak memberi sinyal atau menjamin profit — tanya apa saja soal edukasi trading.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    setMessages((m) => [...m, { role: 'user', text }])
    setInput(''); setLoading(true)
    try {
      const res = await aiService.ask(text)
      setMessages((m) => [...m, { role: 'ai', text: res.answer, relatedLessonId: res.relatedLessonId }])
    } finally { setLoading(false) }
  }

  const onSubmit = (e: FormEvent) => { e.preventDefault(); send(input) }

  return (
    <div className="mx-auto flex h-[calc(100vh-140px)] max-w-2xl flex-col md:h-[calc(100vh-48px)]">
      <div className="mb-2">
        <h1 className="text-2xl font-bold">KOPIAH TRADER AI</h1>
        <p className="text-sm text-charcoal/60">Menjawab dari basis materi KOPIAH TRADER ACADEMY. Belum terhubung ke model AI umum — edukasi saja, bukan sinyal trading.</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-softgray bg-cream-card p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${m.role === 'user' ? 'bg-charcoal text-white' : 'bg-maroon text-white'}`}>
              {m.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
            </div>
            <div className={`max-w-[80%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-charcoal text-white' : 'bg-white'}`}>
              {m.text}
              {m.relatedLessonId && (
                <Link to={`/academy/${m.relatedLessonId}`} className="mt-2 block text-xs font-semibold text-maroon underline">Baca materi lengkap →</Link>
              )}
            </div>
          </div>
        ))}
        {loading && <div className="text-sm text-charcoal/50">KOPIAH TRADER AI sedang mengetik…</div>}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => send(s)} className="rounded-full bg-softgray/50 px-3 py-1 text-xs font-medium hover:bg-softgray">{s}</button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-2 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tulis pertanyaan, mis. 'Apa itu order block?'"
          className="flex-1 rounded-full border border-softgray bg-white px-4 py-2.5 text-sm" />
        <button type="submit" disabled={loading || !input.trim()} className="flex h-10 w-10 items-center justify-center rounded-full bg-maroon text-white disabled:opacity-40" aria-label="Kirim">
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}
