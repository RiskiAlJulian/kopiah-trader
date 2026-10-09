import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, hasSupabase } = useAuth()
  const location = useLocation()

  if (!hasSupabase) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-softgray bg-cream-card p-6 text-center">
        <p className="font-semibold">Supabase belum dikonfigurasi.</p>
        <p className="mt-2 text-sm text-charcoal/70">Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env, lalu restart aplikasi untuk mengaktifkan login, Academy, dan Journal.</p>
      </div>
    )
  }
  if (loading) return <div className="py-20 text-center text-charcoal/50">Memuat sesi…</div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}
