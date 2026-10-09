import { useState } from 'react'
const inp = 'w-full rounded-xl border border-softgray bg-white px-3 py-2'
const N = (v: string) => parseFloat(v)
function F({ l, v, s }: { l: string; v: string; s: (x: string) => void }) {
  return <label className="block text-sm">{l}<input className={inp} inputMode="decimal" value={v} onChange={(e) => s(e.target.value)} /></label>
}
export default function CalculatorPage() {
  const [bal, setBal] = useState('1000'), [risk, setRisk] = useState('1'), [sl, setSl] = useState('5')
  const [en, setEn] = useState(''), [sl2, setSl2] = useState(''), [tp, setTp] = useState('')
  const amount = (N(bal) * N(risk)) / 100
  // XAUUSD: 1 lot = 100 oz -> pergerakan $1 = $100 per 1 lot. SL diisi dalam selisih harga (USD).
  const lot = amount / (N(sl) * 100)
  const rk = Math.abs(N(en) - N(sl2)), rw = Math.abs(N(tp) - N(en))
  const ok = (n: number) => isFinite(n) && n > 0
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="space-y-3 rounded-2xl border border-softgray bg-cream-card p-5">
        <h2 className="font-bold">Risk Calculator (XAUUSD)</h2>
        <F l="Balance (USD)" v={bal} s={setBal} /><F l="Risk %" v={risk} s={setRisk} /><F l="Stop Loss (selisih harga, USD)" v={sl} s={setSl} />
        <p className="text-sm">Risk Amount: <b>{ok(amount) ? `$${amount.toFixed(2)}` : '-'}</b></p>
        <p className="text-sm">Recommended Lot: <b>{ok(lot) ? lot.toFixed(2) : '-'}</b></p>
      </section>
      <section className="space-y-3 rounded-2xl border border-softgray bg-cream-card p-5">
        <h2 className="font-bold">RR Calculator</h2>
        <F l="Entry" v={en} s={setEn} /><F l="Stop Loss" v={sl2} s={setSl2} /><F l="Take Profit" v={tp} s={setTp} />
        <p className="text-sm">Risk: <b>{ok(rk) ? rk.toFixed(2) : '-'}</b> · Reward: <b>{ok(rw) ? rw.toFixed(2) : '-'}</b></p>
        <p className="text-sm">RR Ratio: <b>{ok(rk) && ok(rw) ? `1 : ${(rw / rk).toFixed(2)}` : '-'}</b></p>
      </section>
    </div>
  )
}
