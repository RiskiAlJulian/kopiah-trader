import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { user, hasSupabase, signInWithPassword, signUp, resetPassword } = useAuth()
  const nav = useNavigate()
  const location = useLocation() as { state?: { from?: Location } }
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={location.state?.from?.pathname ?? '/'} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null); setInfo(null); setBusy(true)
    if (mode === 'forgot') {
      const { error } = await resetPassword(email)
      setBusy(false)
      if (error) { setError(error); return }
      setInfo('Jika email itu terdaftar, tautan untuk mengatur ulang password sudah dikirim. Cek inbox (dan folder spam).')
      return
    }
    const fn = mode === 'signin' ? signInWithPassword : signUp
    const { error } = await fn(email, password)
    setBusy(false)
    if (error) { setError(error); return }
    if (mode === 'signup') setInfo('Akun dibuat. Jika verifikasi email aktif di project Supabase kamu, cek inbox sebelum masuk.')
    else nav(location.state?.from?.pathname ?? '/')
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center px-4">
      <Logo size={96} />
      <h1 className="mt-3 text-xl font-bold">{mode === 'signin' ? 'Masuk ke KOPIAH TRADER' : mode === 'signup' ? 'Buat Akun KOPIAH TRADER' : 'Lupa Password'}</h1>
      {!hasSupabase && <p className="mt-3 text-center text-sm text-maroon">Supabase belum dikonfigurasi. Isi .env terlebih dahulu.</p>}
      <form onSubmit={submit} className="mt-5 w-full space-y-3">
        <label className="block text-sm font-medium">Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-softgray bg-white px-3 py-2 text-sm" />
        </label>
        {mode !== 'forgot' && (
          <label className="block text-sm font-medium">Password
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-softgray bg-white px-3 py-2 text-sm" />
          </label>
        )}
        {mode === 'signin' && (
          <button type="button" onClick={() => { setMode('forgot'); setError(null); setInfo(null) }}
            className="text-sm font-semibold text-charcoal/70 hover:text-maroon">Lupa password?</button>
        )}
        {error && <p className="text-sm text-maroon">{error}</p>}
        {info && <p className="text-sm text-emerald-700">{info}</p>}
        <button type="submit" disabled={busy || !hasSupabase}
          className="w-full rounded-full bg-maroon px-4 py-2.5 font-semibold text-white disabled:opacity-40">
          {busy ? 'Memproses…' : mode === 'signin' ? 'Masuk' : mode === 'signup' ? 'Daftar' : 'Kirim tautan reset'}
        </button>
      </form>
      <button onClick={() => { setMode(mode === 'signup' ? 'signin' : mode === 'forgot' ? 'signin' : 'signup'); setError(null); setInfo(null) }} className="mt-4 text-sm font-semibold text-charcoal/70 hover:text-maroon">
        {mode === 'signin' ? 'Belum punya akun? Daftar' : mode === 'signup' ? 'Sudah punya akun? Masuk' : 'Kembali ke Masuk'}
      </button>
    </div>
  )
}
