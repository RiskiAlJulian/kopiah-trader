export default function ComingSoon({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-4 rounded-2xl border border-softgray bg-cream-card p-5 text-charcoal/70">Fitur ini belum dibangun di tahap pertama. Prioritas saat ini: data XAUUSD asli dan chart candlestick.</p>
    </div>
  )
}
