export default function PromoBanner() {
  return (
    <div className="px-6 md:px-[90px]">
      <div className="flex flex-col items-start gap-6 rounded-xl bg-[#101113] px-6 py-8 md:flex-row md:items-center md:justify-between md:px-11 md:py-[30px]">
        <div>
          <div className="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#5A5C62]">
            Offre limitée
          </div>
          <div className="mb-2.5 text-2xl font-black uppercase leading-tight tracking-tight text-white sm:text-[30px]">
            Jusqu'à <span className="text-[#D6FF3F]">&minus;20%</span>
            <br />
            sur votre prochaine location
          </div>
          <div className="max-w-[400px] text-[13px] text-[#8A8C90]">
            Profitez de nos tarifs préférentiels pour toute réservation effectuée avant le 31 août 2026.
            Offre valable sur toute la flotte, sans engagement minimum.
          </div>
        </div>
        <button className="btn-cta shrink-0 whitespace-nowrap px-8 py-4 text-[13px]">
          Découvrir les offres →
        </button>
      </div>
    </div>
  )
}