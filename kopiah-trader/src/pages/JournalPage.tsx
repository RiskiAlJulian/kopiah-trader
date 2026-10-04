import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useJournal } from '../hooks/useJournal'
import StatsCards from '../components/journal/StatsCards'
import TradeForm from '../components/journal/TradeForm'
import TradeList from '../components/journal/TradeList'

function SkeletonCards() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-softgray/50" />)}
    </div>
  )
}

export default function JournalPage() {
  const { trades, addTrade, deleteTrade, stats, isLoading, isError, refetch } = useJournal()
  const [showForm, setShowForm] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeleteError(null)
    try { await deleteTrade(id) } catch { setDeleteError('Gagal menghapus trade. Periksa koneksi dan coba lagi.') }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Trading Journal</h1>
          <p className="text-charcoal/70">Catat trade kamu dan pantau perkembangan proses trading. Tersinkron otomatis di semua perangkat.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-full bg-maroon px-5 py-2.5 font-semibold text-white hover:bg-maroon-dark">
          <Plus size={18} /> TAMBAH TRADE
        </button>
      </div>

      {isError && (
        <div className="flex items-center justify-between rounded-lg bg-red-50 p-3 text-sm text-maroon">
          <span>Gagal memuat data journal dari server.</span>
          <button onClick={() => refetch()} className="font-semibold underline">Coba lagi</button>
        </div>
      )}
      {deleteError && <p className="text-sm text-maroon">{deleteError}</p>}

      {isLoading ? <SkeletonCards /> : <StatsCards stats={stats} />}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-softgray/50" />)}</div>
      ) : (
        <TradeList trades={trades} onDelete={handleDelete} />
      )}

      {showForm && (
        <TradeForm onClose={() => setShowForm(false)} onSave={async (t) => { await addTrade(t); setShowForm(false) }} />
      )}
    </div>
  )
}
