const advantages = [
  {
    icon: '✦',
    title: 'Meilleurs Prix',
    desc: 'Tarifs compétitifs garantis, sans frais cachés ni mauvaises surprises.',
  },
  {
    icon: '◈',
    title: 'Réservation Facile',
    desc: 'En ligne en 3 étapes. Confirmation instantanée par e-mail.',
  },
  {
    icon: '◉',
    title: 'Véhicules Récents',
    desc: 'Flotte 2024-2026, entretenue et contrôlée après chaque location.',
  },
  {
    icon: '◎',
    title: 'Support 24/7',
    desc: 'Une équipe disponible à toute heure, 7 jours sur 7 en Île-de-France.',
  },
]

export default function AdvantagesList() {
  return (
    <div className="grid grid-cols-1 gap-1 px-6 pb-4 sm:grid-cols-2 md:px-[90px] lg:grid-cols-4">
      {advantages.map((advantage) => (
        <div
          key={advantage.title}
          className="rounded-lg bg-white px-5 py-2.5 transition-shadow duration-200 hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)]"
        >
          <div className="mb-0 text-lg font-bold text-[#B8F000]">{advantage.icon}</div>
          <div className="mb-1 text-[13px] font-extrabold uppercase tracking-wide text-[#17181A]">
            {advantage.title}
          </div>
          <div className="text-xs leading-relaxed text-[#4A4C50]">{advantage.desc}</div>
        </div>
      ))}
    </div>
  )
}