export default function Hero() {
  const scrollToBooking = () => {
    document.getElementById('reservation-rapide')?.scrollIntoView({ behavior: 'smooth' })
  }
  const scrollToVehicles = () => {
    document.getElementById('vehicules')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative isolate min-h-[480px] overflow-hidden sm:min-h-[560px] md:min-h-[calc(100vh-5rem)]">      <img
        src="/images/pce_wallpaper.png"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/20" />

      <div className="relative mx-auto flex h-full max-w-[1440px] items-center px-6 py-20 sm:py-28 md:px-16">
        <div className="max-w-xl">
          <h1 className="mb-6 text-3xl font-extrabold uppercase leading-[1.05] tracking-tight text-white sm:text-4xl md:text-5xl">
            Parce que chaque destination mérite{' '}
            <span className="text-[#B8F000]">le meilleur départ</span>
          </h1>

          <p className="mb-9 max-w-[380px] text-base leading-relaxed text-white/80 sm:text-[17px]">
            Des voitures fiables, un service rapide et les meileurs prix du marché.
          </p>

          <div className="flex flex-wrap items-center gap-3.5">
            <button className="btn-cta px-8 py-[15px] text-[13px]" onClick={scrollToBooking}>
              Réserver maintenant →
            </button>
            <button
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/70 transition-colors hover:text-white"
              onClick={scrollToVehicles}
            >
              Voir les véhicules
              <span className="text-base">↗</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}