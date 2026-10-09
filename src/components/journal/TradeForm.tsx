import { useState } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { uploadScreenshot } from '../../services/journalService'
import type { Trade } from '../../types/journal'

const inp = 'w-full rounded-lg border border-softgray bg-white px-3 py-2 text-sm'
const label = 'block text-sm font-medium'

export default function TradeForm({ onSave, onClose }: { onSave: (t: Omit<Trade, 'id'>) => Promise<void>; onClose: () => void }) {
  const { user } = useAuth()
  const [f, setF] = useState<Partial<Trade>>({ direction: 'BUY', result: 'OPEN', date: new Date().toISOString().slice(0, 10), timeframe: '15M' })
  const [uploading, setUploading] = useState<'before' | 'after' | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (k: keyof Trade, v: any) => setF((s) => ({ ...s, [k]: v }))

  const handleFile = async (kind: 'before' | 'after', file?: File) => {
    if (!file || !user) return
    setUploading(kind); setError(null)
    try {
      const url = await uploadScreenshot(user.id, file, kind)
      set(kind === 'before' ? 'beforeImage' : 'afterImage', url)
    } catch {
      setError('Gagal mengunggah screenshot. Periksa koneksi dan coba lagi.')
    } finally {
      setUploading(null)
    }
  }

  const submit = async () => {
    if (!f.pair || f.entry == null) return
    setSaving(true); setError(null)
    try {
      await onSave({
        pair: f.pair, direction: f.direction ?? 'BUY',
        entry: Number(f.entry), stopLoss: Number(f.stopLoss ?? 0), takeProfit: Number(f.takeProfit ?? 0),
        lot: Number(f.lot ?? 0), riskPercent: Number(f.riskPercent ?? 0), result: f.result ?? 'OPEN',
        profitLoss: Number(f.profitLoss ?? 0), date: f.date ?? new Date().toISOString().slice(0, 10),
        timeframe: f.timeframe ?? '15M', strategy: f.strategy ?? '', emotion: f.emotion ?? '',
        reason: f.reason ?? '', mistake: f.mistake ?? '', notes: f.notes ?? '',
        beforeImage: f.beforeImage, afterImage: f.afterImage
      })
    } catch {
      setError('Gagal menyimpan trade ke server. Periksa koneksi dan coba lagi.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-cream-card p-5 sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Tambah Trade</h2>
          <button onClick={onClose} aria-label="Tutup"><X size={20} /></button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={label}>Pair<input className={inp} placeholder="XAUUSD" value={f.pair ?? ''} onChange={(e) => set('pair', e.target.value.toUpperCase())} /></label>
          <label className={label}>Direction
            <select className={inp} value={f.direction} onChange={(e) => set('direction', e.target.value)}><option>BUY</option><option>SELL</option></select>
          </label>
          <label className={label}>Entry<input className={inp} inputMode="decimal" value={f.entry ?? ''} onChange={(e) => set('entry', e.target.value)} /></label>
          <label className={label}>Stop Loss<input className={inp} inputMode="decimal" value={f.stopLoss ?? ''} onChange={(e) => set('stopLoss', e.target.value)} /></label>
          <label className={label}>Take Profit<input className={inp} inputMode="decimal" value={f.takeProfit ?? ''} onChange={(e) => set('takeProfit', e.target.value)} /></label>
          <label className={label}>Lot<input className={inp} inputMode="decimal" value={f.lot ?? ''} onChange={(e) => set('lot', e.target.value)} /></label>
          <label className={label}>Risk %<input className={inp} inputMode="decimal" value={f.riskPercent ?? ''} onChange={(e) => set('riskPercent', e.target.value)} /></label>
          <label className={label}>Result
            <select className={inp} value={f.result} onChange={(e) => set('result', e.target.value)}>
              <option>OPEN</option><option>WIN</option><option>LOSS</option><option>BE</option>
            </select>
          </label>
          <label className={label}>Profit/Loss (USD)<input className={inp} inputMode="decimal" value={f.profitLoss ?? ''} onChange={(e) => set('profitLoss', e.target.value)} /></label>
          <label className={label}>Date<input type="date" className={inp} value={f.date} onChange={(e) => set('date', e.target.value)} /></label>
          <label className={label}>Timeframe<input className={inp} value={f.timeframe} onChange={(e) => set('timeframe', e.target.value)} /></label>
          <label className={label}>Strategy<input className={inp} value={f.strategy ?? ''} onChange={(e) => set('strategy', e.target.value)} /></label>
          <label className={label}>Emotion<input className={inp} placeholder="Tenang / FOMO / Ragu" value={f.emotion ?? ''} onChange={(e) => set('emotion', e.target.value)} /></label>
          <label className={label}>Mistake<input className={inp} value={f.mistake ?? ''} onChange={(e) => set('mistake', e.target.value)} /></label>
        </div>
        <label className={`${label} mt-3`}>Reason (alasan entry)<textarea className={inp} rows={2} value={f.reason ?? ''} onChange={(e) => set('reason', e.target.value)} /></label>
        <label className={`${label} mt-3`}>Notes<textarea className={inp} rows={2} value={f.notes ?? ''} onChange={(e) => set('notes', e.target.value)} /></label>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className={label}>Before Entry Screenshot
            <input type="file" accept="image/*" className={inp} disabled={uploading !== null}
              onChange={(e) => handleFile('before', e.target.files?.[0])} />
            {uploading === 'before' && <span className="mt-1 block text-xs text-charcoal/60">Mengunggah…</span>}
            {f.beforeImage && uploading !== 'before' && <img src={f.beforeImage} alt="Before" className="mt-2 h-16 rounded-lg border border-softgray object-cover" />}
          </label>
          <label className={label}>After Exit Screenshot
            <input type="file" accept="image/*" className={inp} disabled={uploading !== null}
              onChange={(e) => handleFile('after', e.target.files?.[0])} />
            {uploading === 'after' && <span className="mt-1 block text-xs text-charcoal/60">Mengunggah…</span>}
            {f.afterImage && uploading !== 'after' && <img src={f.afterImage} alt="After" className="mt-2 h-16 rounded-lg border border-softgray object-cover" />}
          </label>
        </div>
        <p className="mt-2 text-[11px] text-charcoal/50">Screenshot diunggah ke Supabase Storage dan tersinkron di semua perangkat.</p>

        {error && <p className="mt-3 text-sm text-maroon">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-full border border-softgray px-4 py-2 text-sm font-semibold">Batal</button>
          <button onClick={submit} disabled={!f.pair || f.entry == null || saving || uploading !== null}
            className="rounded-full bg-maroon px-5 py-2 text-sm font-semibold text-white disabled:opacity-40">
            {saving ? 'Menyimpan…' : 'Simpan Trade'}
          </button>
        </div>
      </div>
    </div>
  )
}
