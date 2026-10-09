import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Bot, RotateCcw, Send, User as UserIcon } from 'lucide-react'
import RichText from '../components/RichText'
import { aiService, type ChatMessage } from '../services/aiService'

interface Msg { role: 'user' | 'ai'; text: string; relatedLessonId?: string; error?: boolean; greeting?: boolean; notice?: string }

const GREETING: Msg = {
  role: 'ai', greeting: true,
  text: 'Hai! Aku KOPIAH TRADER AI. Tanya apa saja: materi trading, belajar, menulis, coding, dan lainnya. Untuk topik trading, aku bersifat edukasi: tanpa sinyal pasti dan tanpa janji profit.'
}
const SUGGESTIONS = ['Jelaskan BOS dan CHOCH', 'Cara menghitung risk per trade', 'Apa itu market structure?', 'Buatkan rencana belajar trading 30 hari']

export default function AIPage() {
  const [messages, setMessages] = useState<Msg[]>([GREETING])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'unknown' | 'llm' | 'local'>('unknown')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, loading])

  const send = async (text: string) => {
    const q = text.trim()
    if (!q || loading) return
    // Riwayat untuk model: tanpa sapaan awal dan tanpa pesan gangguan.
    const history: ChatMessage[] = [
      ...messages.filter((m) => !m.greeting && !m.error).map((m): ChatMessage => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
      { role: 'user', content: q }
    ]
    setMessages((m) => [...m, { role: 'user', text: q }])
    setInput('')
    setLoading(true)
    const res = await aiService.ask(history)
    if (res.source !== 'error') setMode(res.source)
    setMessages((m) => [...m, { role: 'ai', text: res.answer, relatedLessonId: res.relatedLessonId, error: res.source === 'error', notice: res.notice }])
    setLoading(false)
  }

  const onSubmit = (e: FormEvent) => { e.preventDefault(); send(input) }
  const reset = () => { if (!loading) { setMessages([GREETING]); setInput('') } }

  return (
    <div className="mx-auto flex h-[calc(100vh-140px)] max-w-2xl flex-col md:h-[calc(100vh-48px)]">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">KOPIAH TRADER AI</h1>
          <p className="text-sm text-charcoal/60">
            {mode === 'local'
              ? 'AI umum belum tersambung. Saat ini menjawab dari materi Academy.'
              : 'Jawaban AI bisa keliru, cek lagi hal penting. Topik trading bersifat edukasi, bukan sinyal.'}
          </p>
        </div>
        {messages.length > 1 && (
          <button onClick={reset} disabled={loading} className="flex shrink-0 items-center gap-1.5 rounded-full border border-softgray px-3 py-1.5 text-xs font-semibold hover:bg-softgray/50 disabled:opacity-40">
            <RotateCcw size={13} />Chat baru
          </button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-softgray bg-cream-card p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${m.role === 'user' ? 'bg-charcoal text-white' : 'bg-maroon text-white'}`}>
              {m.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
            </div>
            <div className={`min-w-0 max-w-[85%] break-words rounded-2xl px-3 py-2 text-sm ${m.role === 'user' ? 'whitespace-pre-wrap bg-charcoal text-white' : m.error ? 'bg-red-50 text-maroon' : 'bg-white'}`}>
              {m.role === 'user' ? m.text : <RichText text={m.text} />}
              {m.relatedLessonId && (
                <Link to={`/academy/${m.relatedLessonId}`} className="mt-2 block text-xs font-semibold text-maroon underline">Baca materi lengkap</Link>
              )}
              {m.notice && <p className="mt-2 text-[11px] text-charcoal/50">{m.notice}</p>}
            </div>
          </div>
        ))}
        {loading && <div className="text-sm text-charcoal/50">KOPIAH TRADER AI sedang mengetik…</div>}
        <div ref={bottomRef} />
      </div>

      {messages.length === 1 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} className="rounded-full bg-softgray/50 px-3 py-1 text-xs font-medium hover:bg-softgray">{s}</button>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-2 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tanya apa saja…" maxLength={2000}
          className="flex-1 rounded-full border border-softgray bg-white px-4 py-2.5 text-sm" />
        <button type="submit" disabled={loading || !input.trim()} className="flex h-10 w-10 items-center justify-center rounded-full bg-maroon text-white disabled:opacity-40" aria-label="Kirim">
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}
