import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { useAuth } from '../contexts/AuthContext'
import { HAS_SUPABASE, supabase } from '../lib/supabaseClient'

// Halaman tujuan tautan di email reset. Supabase membaca token dari URL dan
// membuat sesi "recovery"; setelah itu pengguna boleh memasang password baru.
export default function ResetPasswordPage() {
  const { updatePassword } = useAuth()
  const nav = useNavigate()
  const [ready, setReady] = useState(false)
  const [expired, setExpired] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!HAS_SUPABASE) return
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    // Jika tidak ada sesi sama sekali setelah token diproses, tautan tidak valid/kedaluwarsa.
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) setReady(true)
      else setExpired(true)
    }, 1500)
    return () => { sub.subscription.unsubscribe(); clearTimeout(t) }
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) { setError('Konfirmasi password tidak sama.'); return }
    setBusy(true)
    const { error } = await updatePassword(password)
    setBusy(false)
    if (error) { setError(error); return }
    setDone(true)
    setTimeout(() => nav('/', { replace: true }), 1800)
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center px-4">
      <Logo size={96} />
      <h1 className="mt-3 text-xl font-bold">Atur Password Baru</h1>
      {done ? (
        <p className="mt-4 text-center text-sm text-emerald-700">Password berhasil diganti. Mengalihkan…</p>
      ) : expired && !ready ? (
        <div className="mt-4 text-center text-sm">
          <p className="text-maroon">Tautan tidak valid atau sudah kedaluwarsa.</p>
          <Link to="/login" className="mt-3 inline-block font-semibold text-charcoal/70 hover:text-maroon">Minta tautan baru</Link>
        </div>
      ) : !ready ? (
        <p className="mt-4 text-sm text-charcoal/70">Memeriksa tautan…</p>
      ) : (
        <form onSubmit={submit} className="mt-5 w-full space-y-3">
          <label className="block text-sm font-medium">Password baru
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-softgray bg-white px-3 py-2 text-sm" />
          </label>
          <label className="block text-sm font-medium">Ulangi password baru
            <input type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-lg border border-softgray bg-white px-3 py-2 text-sm" />
          </label>
          {error && <p className="text-sm text-maroon">{error}</p>}
          <button type="submit" disabled={busy}
            className="w-full rounded-full bg-maroon px-4 py-2.5 font-semibold text-white disabled:opacity-40">
            {busy ? 'Menyimpan…' : 'Simpan password'}
          </button>
        </form>
      )}
    </div>
  )
}
