import { useMemo, useState, type ReactNode } from 'react'
import { useCandles } from '../hooks/useMarketData'
import { analyze, MIN_CANDLES, type Analysis as Result, type Zone } from '../lib/analysis'
import { calcLot, usdPerPriceUnitPerLot } from '../lib/risk'
import { MissingKeyError, ProviderError, RateLimitError } from '../providers/errors'
import type { Interval } from '../types/market'
import { fmtWIBShort } from '../utils/format'

const TIMEFRAMES: Interval[] = ['5M', '15M', '1H', '4H', '1D']
const decimalsFor = (p: number) => (p >= 1000 ? 2 : p >= 20 ? 3 : p >= 1 ? 5 : 6)

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-4 border-t border-softgray pt-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-charcoal/50">{title}</h3>
      <div className="mt-2 space-y-1.5 text-sm">{children}</div>
    </section>
  )
}

const BIAS_STYLE = { Bullish: 'bg-emerald-50 text-emerald-800', Bearish: 'bg-red-50 text-maroon', Netral: 'bg-softgray/60 text-charcoal/70' } as const

export default function Analysis({ id }: { id: string }) {
  const [tf, setTf] = useState<Interval>('15M')
  const q = useCandles(id, tf)
  const result: Result | null = useMemo(() => (q.data ? analyze(q.data) : null), [q.data])

  const d = result ? decimalsFor(result.price) : 2
  const f = (n: number) => n.toFixed(d)
  const zoneText = (z: Zone) => (z.source === 'level' ? `${f((z.low + z.high) / 2)}` : `${f(z.low)} – ${f(z.high)}`)

  return (
    <div className="rounded-2xl border border-softgray bg-cream-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-maroon">KOPIAH TRADER ANALYSIS</div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {TIMEFRAMES.map((t) => (
          <button key={t} onClick={() => setTf(t)} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tf === t ? 'bg-maroon text-white' : 'bg-softgray/50 hover:bg-softgray'}`}>{t}</button>
        ))}
      </div>

      {q.isPending && <div className="mt-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-xl bg-softgray/50" />)}</div>}

      {q.isError && (
        <div className="mt-4 text-sm">
          <p>
            {q.error instanceof RateLimitError ? 'Data harga sedang mencapai batas request. Akan dicoba lagi otomatis.'
              : q.error instanceof MissingKeyError ? 'Server belum diisi TWELVE_DATA_API_KEY. Isi di Vercel lalu redeploy.'
                : 'Data candle untuk instrumen ini belum tersedia.'}
          </p>
          {q.error instanceof ProviderError && <p className="mt-1 text-[11px] text-charcoal/50">Detail teknis: {q.error.message}</p>}
          <button onClick={() => q.refetch()} className="mt-2 rounded-full bg-maroon px-3 py-1.5 text-xs font-semibold text-white">Coba lagi</button>
        </div>
      )}

      {q.isSuccess && !result && (
        <p className="mt-4 text-sm text-charcoal/70">Data candle belum cukup untuk dianalisis (butuh minimal {MIN_CANDLES + 1}, tersedia {q.data.length}). Coba timeframe lain.</p>
      )}

      {result && (
        <>
          <p className="mt-3 text-[11px] text-charcoal/50">Dihitung dari candle yang sudah close. Candle terakhir: {fmtWIBShort(result.lastTime)} · Harga {f(result.price)} · ATR {f(result.atr)}</p>

          <Section title="Market Bias">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-sm font-bold ${BIAS_STYLE[result.bias.label]}`}>{result.bias.label}</span>
              {result.bias.dir && <span className="text-xs text-charcoal/60">keyakinan {result.bias.strength}</span>}
            </div>
            <ul className="list-disc space-y-0.5 pl-4 text-xs text-charcoal/70">{result.bias.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
            <p className="text-xs text-charcoal/70">
              {result.structure.lastBreak
                ? `Struktur terbaru: ${result.structure.lastBreak.kind} ${result.structure.lastBreak.dir === 'bull' ? 'bullish' : 'bearish'} di ${f(result.structure.lastBreak.level)} (${result.structure.lastBreak.candlesAgo === 0 ? 'candle terakhir' : `${result.structure.lastBreak.candlesAgo} candle lalu`}).`
                : 'Belum ada BOS/CHOCH baru dalam 6 candle terakhir.'}
            </p>
            <p className="text-xs text-charcoal/70">Posisi harga: <b>{result.range.label}</b> ({Math.round(result.range.position * 100)}% dari range 50 candle: {f(result.range.low)} – {f(result.range.high)}).</p>
          </Section>

          <Section title="Area of Interest">
            {result.resistances.length === 0 && result.supports.length === 0 && result.fvgs.length === 0 && <p className="text-xs text-charcoal/60">Belum ada area yang jelas di timeframe ini.</p>}
            {[...result.resistances].reverse().map((z, i) => <ZoneRow key={`r${i}`} tone="bear" title={z.label} value={zoneText(z)} />)}
            <div className="my-1 flex items-center gap-2 text-[11px] font-semibold text-charcoal/60"><span className="h-px flex-1 bg-softgray" />Harga {f(result.price)}<span className="h-px flex-1 bg-softgray" /></div>
            {result.supports.map((z, i) => <ZoneRow key={`s${i}`} tone="bull" title={z.label} value={zoneText(z)} />)}
            {result.fvgs.length > 0 && <p className="pt-1 text-[11px] font-semibold text-charcoal/50">Fair Value Gap (belum terisi)</p>}
            {result.fvgs.map((z, i) => <ZoneRow key={`g${i}`} tone={z.dir} title={z.label} value={zoneText(z)} />)}
          </Section>

          <Section title="Confirmation">
            {result.confirmation.dir === null ? (
              <p className="text-xs text-charcoal/60">Menunggu bias yang jelas. Tanpa arah, konfirmasi belum bisa dinilai.</p>
            ) : (
              <>
                <p className="text-xs font-semibold">
                  {result.confirmation.score === 3 ? 'Konfirmasi lengkap (3/3)' : result.confirmation.score === 2 ? 'Konfirmasi sebagian (2/3)' : `Belum ada konfirmasi (${result.confirmation.score}/3)`}
                  <span className="font-normal text-charcoal/60"> · arah {result.confirmation.dir === 'bull' ? 'naik' : 'turun'}</span>
                </p>
                {result.confirmation.items.map((it) => (
                  <div key={it.label} className="flex gap-2 text-xs">
                    <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${it.ok ? 'bg-emerald-600 text-white' : 'bg-softgray text-charcoal/50'}`}>{it.ok ? '✓' : '·'}</span>
                    <span><b>{it.label}.</b> <span className="text-charcoal/70">{it.detail}</span></span>
                  </div>
                ))}
              </>
            )}
          </Section>

          <Section title="Trading Plan (contoh skenario edukasi)">
            {result.plan ? (
              <>
                <p className="text-xs"><b>{result.plan.dir === 'bull' ? 'Skenario naik (buy)' : 'Skenario turun (sell)'}</b> dari {result.plan.zone.label} di {zoneText(result.plan.zone)}.</p>
                <p className="text-xs text-charcoal/70">{result.plan.inZone ? 'Harga sedang berada di dalam zona.' : 'Skenario ini baru relevan jika harga kembali ke zona tersebut.'}{result.confirmation.score < 2 && ' Konfirmasi di atas belum cukup, jadi tidak ada alasan masuk dulu.'}</p>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 rounded-xl bg-white p-3 text-xs">
                  <dt className="text-charcoal/50">Entry</dt><dd className="text-right font-semibold">{f(result.plan.entry)}</dd>
                  <dt className="text-charcoal/50">Stop Loss</dt><dd className="text-right font-semibold text-maroon">{f(result.plan.stop)}</dd>
                  <dt className="text-charcoal/50">TP1 (RR 1:{result.plan.rr1.toFixed(1)})</dt><dd className="text-right font-semibold text-emerald-800">{f(result.plan.tp1)}</dd>
                  <dt className="text-charcoal/50">TP2 (RR 1:{result.plan.rr2.toFixed(1)})</dt><dd className="text-right font-semibold text-emerald-800">{f(result.plan.tp2)}</dd>
                </dl>
                {result.plan.warnings.map((w) => <p key={w} className="text-[11px] text-orange-800">⚠ {w}</p>)}
              </>
            ) : (
              <p className="text-xs text-charcoal/60">{result.planReason}</p>
            )}
          </Section>

          <RiskSection id={id} price={result.price} decimals={d} plan={result.plan ? { entry: result.plan.entry, stop: result.plan.stop, tp1: result.plan.tp1 } : null} />
        </>
      )}

      <p className="mt-4 text-[11px] text-charcoal/50">Hanya untuk edukasi dan bukan saran trading. Ini pembacaan otomatis dari rumus sederhana (SMA, swing, FVG), bukan sinyal. Tidak ada jaminan profit. Selalu terapkan Risk Management.</p>
    </div>
  )
}

function ZoneRow({ tone, title, value }: { tone: 'bull' | 'bear'; title: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${tone === 'bull' ? 'bg-emerald-600' : 'bg-maroon'}`} />{title}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

function RiskSection({ id, price, decimals, plan }: { id: string; price: number; decimals: number; plan: { entry: number; stop: number; tp1: number } | null }) {
  const [balance, setBalance] = useState('1000')
  const [riskPct, setRiskPct] = useState('1')
  const [manualSl, setManualSl] = useState('')
  const spec = usdPerPriceUnitPerLot(id, price)
  const stopDist = plan ? Math.abs(plan.entry - plan.stop) : parseFloat(manualSl)
  const bal = parseFloat(balance), rp = parseFloat(riskPct)
  const res = calcLot(bal, rp, stopDist, spec?.value ?? null)
  const reward = plan && res.lot && spec ? res.lot * Math.abs(plan.tp1 - plan.entry) * spec.value : null
  const inp = 'w-full rounded-lg border border-softgray bg-white px-2 py-1.5 text-xs'
  return (
    <Section title="Risk Management">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px] text-charcoal/60">Balance (USD)<input className={inp} inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value)} /></label>
        <label className="text-[11px] text-charcoal/60">Risk per trade (%)<input className={inp} inputMode="decimal" value={riskPct} onChange={(e) => setRiskPct(e.target.value)} /></label>
      </div>
      {plan ? (
        <p className="text-xs text-charcoal/70">Jarak Stop Loss dari skenario di atas: <b>{stopDist.toFixed(decimals)}</b></p>
      ) : (
        <label className="block text-[11px] text-charcoal/60">Jarak Stop Loss (selisih harga)<input className={inp} inputMode="decimal" value={manualSl} onChange={(e) => setManualSl(e.target.value)} placeholder="mis. 5" /></label>
      )}
      {rp > 2 && <p className="text-[11px] text-orange-800">⚠ Risk di atas 2% per trade tergolong agresif.</p>}
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 rounded-xl bg-white p-3 text-xs">
        <dt className="text-charcoal/50">Risk amount</dt><dd className="text-right font-semibold">{res.riskAmount > 0 ? `$${res.riskAmount.toFixed(2)}` : '-'}</dd>
        <dt className="text-charcoal/50">Lot disarankan</dt><dd className="text-right font-semibold">{res.lot ? res.lot.toFixed(2) : '-'}</dd>
        {res.actualRisk !== null && <><dt className="text-charcoal/50">Risk sebenarnya</dt><dd className="text-right font-semibold">${res.actualRisk.toFixed(2)}</dd></>}
        {reward !== null && <><dt className="text-charcoal/50">Potensi di TP1</dt><dd className="text-right font-semibold text-emerald-800">${reward.toFixed(2)}</dd></>}
      </dl>
      {res.belowMin && <p className="text-[11px] text-orange-800">⚠ Lot minimum 0.01 sudah melebihi risk yang kamu pilih. Kecilkan jarak stop atau naikkan balance.</p>}
      {spec ? (
        <p className="text-[11px] text-charcoal/50">Asumsi: {spec.assumption}. Cocokkan dengan spesifikasi broker kamu.</p>
      ) : (
        <p className="text-[11px] text-charcoal/50">Hitung lot belum didukung untuk instrumen ini (spesifikasi kontrak berbeda-beda tiap broker). Risk amount tetap bisa dipakai sebagai acuan.</p>
      )}
    </Section>
  )
}
