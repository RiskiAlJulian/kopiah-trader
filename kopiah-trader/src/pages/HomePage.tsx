import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import PriceBlock from '../components/PriceBlock'

export default function HomePage() {
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
      <section className="text-center lg:text-left">
        <div className="flex justify-center lg:justify-start"><Logo size={200} /></div>
        <h1 className="mt-2 text-3xl font-bold">Belajar. Menganalisis. Berproses.</h1>
        <p className="mt-3 text-charcoal/70">Platform trading untuk membantu trader membangun proses, disiplin, dan karakter.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3 lg:justify-start">
          <Link to="/academy" className="rounded-full bg-maroon px-5 py-2.5 font-semibold text-white hover:bg-maroon-dark">MULAI SEKARANG</Link>
          <Link to="/market" className="rounded-full border border-charcoal px-5 py-2.5 font-semibold hover:bg-softgray/50">LIHAT MARKET</Link>
        </div>
      </section>
      <section><PriceBlock id="XAUUSD" /></section>
    </div>
  )
}
