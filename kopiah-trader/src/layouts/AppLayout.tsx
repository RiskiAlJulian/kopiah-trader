import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { BarChart3, BookOpen, Bot, Calculator, Home, LogIn, LogOut, Newspaper, NotebookPen, Radio, User, Users, Download, Menu, X } from 'lucide-react'
import Logo from '../components/Logo'
import { useAuth } from '../contexts/AuthContext'

const ALL = [
  { to: '/', label: 'Home', icon: Home }, { to: '/market', label: 'Market', icon: BarChart3 },
  { to: '/live', label: 'Live Trade', icon: Radio }, { to: '/news', label: 'News', icon: Newspaper },
  { to: '/academy', label: 'Academy', icon: BookOpen }, { to: '/journal', label: 'Journal', icon: NotebookPen },
  { to: '/calculator', label: 'Calculator', icon: Calculator }, { to: '/ai', label: 'AI', icon: Bot },
  { to: '/community', label: 'Community', icon: Users }, { to: '/profile', label: 'Profile', icon: User }
]
const MOBILE = ['/', '/market', '/academy', '/journal', '/profile']
// Menu yang tidak muat di bar bawah HP -> dibuka lewat tombol "Menu".
const MORE = ALL.filter((n) => !MOBILE.includes(n.to))

export default function AppLayout() {
  const { user, signOut, hasSupabase } = useAuth()
  const [prompt, setPrompt] = useState<any>(null)
  const { pathname } = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  useEffect(() => { setMoreOpen(false) }, [pathname]) // tutup panel setiap pindah halaman
  const moreActive = MORE.some((n) => pathname.startsWith(n.to))
  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setPrompt(e) }
    window.addEventListener('beforeinstallprompt', h); return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])
  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-softgray bg-cream-card p-4 md:flex">
        <Logo size={160} />
        <nav className="mt-4 flex flex-1 flex-col gap-1 overflow-y-auto">
          {ALL.map(({ to, label, icon: I }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${isActive ? 'bg-maroon text-white' : 'hover:bg-softgray/50'}`}><I size={18} />{label}</NavLink>
          ))}
        </nav>
        {prompt && <button onClick={() => prompt.prompt()} className="mt-2 flex items-center gap-2 rounded-xl border border-maroon px-3 py-2 text-sm font-semibold text-maroon"><Download size={16} />Install aplikasi</button>}
        {hasSupabase && (
          user ? (
            <div className="mt-3 border-t border-softgray pt-3">
              <p className="truncate text-xs text-charcoal/60">{user.email}</p>
              <button onClick={() => signOut()} className="mt-1 flex items-center gap-2 text-sm font-semibold text-charcoal/70 hover:text-maroon"><LogOut size={16} />Keluar</button>
            </div>
          ) : (
            <NavLink to="/login" className="mt-3 flex items-center gap-2 border-t border-softgray pt-3 text-sm font-semibold text-charcoal/70 hover:text-maroon"><LogIn size={16} />Masuk</NavLink>
          )
        )}
      </aside>
      <div className="min-w-0 flex-1 pb-20 md:pb-0">
        <header className="flex items-center justify-between border-b border-softgray bg-cream-card px-4 py-2 md:hidden">
          <Logo size={48} /><span className="font-bold tracking-widest">KOPIAH TRADER</span>
          {prompt ? <button onClick={() => prompt.prompt()} aria-label="Install"><Download size={20} className="text-maroon" /></button> : <span className="w-5" />}
        </header>
        <main className="mx-auto w-full max-w-7xl p-4 md:p-6"><Outlet /></main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-softgray bg-cream-card pb-[env(safe-area-inset-bottom)] md:hidden">
        {ALL.filter((n) => MOBILE.includes(n.to)).map(({ to, label, icon: I }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${isActive ? 'font-semibold text-maroon' : 'text-charcoal/70'}`}><I size={20} />{label}</NavLink>
        ))}
        <button onClick={() => setMoreOpen(true)} className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${moreActive ? 'font-semibold text-maroon' : 'text-charcoal/70'}`}>
          <Menu size={20} />Menu
        </button>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMoreOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-cream-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-bold">Menu</span>
              <button onClick={() => setMoreOpen(false)} aria-label="Tutup menu"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {MORE.map(({ to, label, icon: I }) => (
                <NavLink key={to} to={to} className={({ isActive }) => `flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium ${isActive ? 'border-maroon bg-white text-maroon' : 'border-softgray bg-white/60'}`}>
                  <I size={22} />{label}
                </NavLink>
              ))}
            </div>
            {hasSupabase && (
              <div className="mt-4 border-t border-softgray pt-3">
                {user ? (
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-xs text-charcoal/60">{user.email}</p>
                    <button onClick={() => { setMoreOpen(false); signOut() }} className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-maroon"><LogOut size={16} />Keluar</button>
                  </div>
                ) : (
                  <NavLink to="/login" className="flex items-center gap-2 text-sm font-semibold text-maroon"><LogIn size={16} />Masuk</NavLink>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
