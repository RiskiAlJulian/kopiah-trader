// Fungsi server Vercel: menjembatani aplikasi ke model AI.
// API key HANYA ada di sini (environment variable Vercel), tidak pernah dikirim ke browser.
//
// Isi salah satu di Vercel > Settings > Environment Variables (TANPA awalan VITE_):
//   GEMINI_API_KEY      -> memakai Google Gemini (ada tier gratis)
//   ANTHROPIC_API_KEY   -> memakai Claude (berbayar), dipakai kalau GEMINI_API_KEY kosong
// Opsional: GEMINI_MODEL (default gemini-2.5-flash), ANTHROPIC_MODEL (default claude-haiku-5-5)

const MAX_MESSAGES = 12 // riwayat percakapan yang dikirim ke model
const MAX_CHARS = 4000 // batas panjang per pesan

const SYSTEM_PROMPT = `Kamu adalah KOPIAH TRADER AI, asisten di aplikasi KOPIAH TRADER (platform edukasi trading, fokus emas/XAUUSD).
- Jawab dalam bahasa yang dipakai pengguna (default Bahasa Indonesia). Jelas, ringkas, dan boleh memakai daftar atau **teks tebal**.
- Kamu boleh menjawab pertanyaan umum apa pun (belajar, coding, menulis, matematika, dan lainnya), tidak terbatas pada trading.
- Untuk topik trading atau investasi: sifatnya edukasi. Jangan memberi sinyal buy/sell yang pasti, jangan menjanjikan profit, dan ingatkan soal risk management bila relevan. Kamu bukan penasihat keuangan.
- Kamu tidak punya akses data harga atau berita real-time. Kalau ditanya harga atau berita terkini, katakan terus terang dan arahkan ke halaman Market atau News di aplikasi.
- Kalau tidak yakin, katakan tidak yakin. Jangan mengarang fakta.`

/** Rapikan riwayat: buang yang tidak valid, gabung peran berurutan yang sama, pastikan diawali dan diakhiri pesan user. */
export function normalize(input) {
  if (!Array.isArray(input)) return []
  const out = []
  for (const m of input.slice(-MAX_MESSAGES)) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') continue
    const content = m.content.trim().slice(0, MAX_CHARS)
    if (!content) continue
    const last = out[out.length - 1]
    if (last && last.role === m.role) last.content += '\n\n' + content
    else out.push({ role: m.role, content })
  }
  while (out.length && out[0].role !== 'user') out.shift()
  while (out.length && out[out.length - 1].role !== 'user') out.pop()
  return out
}

// Hanya pengguna yang sudah login (token Supabase valid) yang boleh memakai AI,
// supaya kuota/biaya API key tidak dipakai orang asing.
async function verifyUser(req) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !anon) return 'misconfigured'
  const header = req.headers?.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return false
  try {
    const r = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } })
    return r.ok
  } catch {
    return false
  }
}

async function askGemini(key, messages) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      generationConfig: { maxOutputTokens: 4096, temperature: 0.7 }
    })
  })
  if (!r.ok) {
    const err = new Error(`gemini ${r.status}: ${(await r.text()).slice(0, 300)}`)
    err.status = r.status
    throw err
  }
  const data = await r.json()
  const cand = data.candidates?.[0]
  const text = (cand?.content?.parts || []).map((p) => p.text || '').join('').trim()
  if (text) return text
  const reason = data.promptFeedback?.blockReason || cand?.finishReason
  return `Maaf, aku tidak bisa menjawab itu${reason ? ` (${reason})` : ''}. Coba ubah pertanyaannya.`
}

async function askAnthropic(key, messages) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages
    })
  })
  if (!r.ok) {
    const err = new Error(`anthropic ${r.status}: ${(await r.text()).slice(0, 300)}`)
    err.status = r.status
    throw err
  }
  const data = await r.json()
  const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim()
  return text || 'Maaf, aku tidak punya jawaban untuk itu.'
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const geminiKey = process.env.GEMINI_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!geminiKey && !anthropicKey) return res.status(503).json({ error: 'not_configured' })

  const auth = await verifyUser(req)
  if (auth === 'misconfigured') return res.status(500).json({ error: 'server_misconfigured' })
  if (!auth) return res.status(401).json({ error: 'unauthorized' })

  const messages = normalize(req.body?.messages)
  if (messages.length === 0) return res.status(400).json({ error: 'bad_request' })

  try {
    const answer = geminiKey ? await askGemini(geminiKey, messages) : await askAnthropic(anthropicKey, messages)
    return res.status(200).json({ answer })
  } catch (e) {
    if (e && e.status === 429) return res.status(429).json({ error: 'rate_limited' })
    console.error('chat error:', e && (e.message || e)) // terlihat di Vercel > Logs
    return res.status(502).json({ error: 'upstream_error' })
  }
}
