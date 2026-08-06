import { Link } from 'react-router-dom'
import { useVehicles } from '../hooks/useVehicles'

const includedKm: Record<'24h' | '3j' | 'semaine', string> = {
  '24h': '250 km',
  '3j': '750 km',
  'semaine': 'À renseigner',
}

const infoCards = [
  { title: 'Inclus', text: 'Assurance tous risques, kilométrage indiqué.' },
  { title: 'Surplus', text: 'Km supplémentaires: 0,50 €/ km,' },
  { title: 'Longue durée', text: 'Au-delà de 7 jours : Contactez nous pour demandez un devis.' },
]

export default function ServicesPage() {
  const { vehicles, isLoading, error } = useVehicles()

  return (
    <div className="bg-background text-foreground">
      <section className="mx-auto max-w-6xl px-6 py-14 md:px-12">
        <h1 className="text-3xl font-bold uppercase tracking-wide sm:text-4xl">
          Tarifs & <span className="text-primary">Services</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Prix tout compris par durée, caution bloquée (jamais débitée si le véhicule revient intact).
        </p>

        {isLoading && (
          <p className="mt-10 text-sm text-muted-foreground">Chargement des tarifs...</p>
        )}

        {error && (
          <p className="mt-10 text-sm text-destructive">{error}</p>
        )}

        {!isLoading && !error && vehicles.length > 0 && (
          <div className="mt-10 overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 font-semibold">Véhicule</th>
                  <th className="px-4 py-3 font-semibold">
                    24h
                    <span className="block text-[11px] font-normal text-muted-foreground">
                      {includedKm['24h']}
                    </span>
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    3 jours
                    <span className="block text-[11px] font-normal text-muted-foreground">
                      {includedKm['3j']}
                    </span>
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    1 semaine
                    <span className="block text-[11px] font-normal text-muted-foreground">
                      {includedKm['semaine']}
                    </span>
                  </th>
                  <th className="px-4 py-3 font-semibold">+ d'une semaine</th>
                  <th className="px-4 py-3 font-semibold">Caution</th>
                  <th className="px-4 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-4">
                      <span className="block font-semibold">{vehicle.name}</span>
                      <span className="text-xs text-muted-foreground">{vehicle.category}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-semi-bold text-primary">
                      {vehicle.pricePerDay} €
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-semi-bold text-primary">
                      {vehicle.priceThreeDays === null ? 'Sur devis' : `${vehicle.priceThreeDays} €`}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-semi-bold text-primary">
                      {vehicle.pricePerWeek === null ? 'Sur devis' : `${vehicle.pricePerWeek} €`}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-semi-bold text-primary">
                      <Link to="/contact"  className="text-primary underline">
                        Sur devis
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      {vehicle.depositAmount === null ? '—' : `${vehicle.depositAmount} €`}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <Link to={`/reservation/${vehicle.id}`} className="text-primary">
                        Réserver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {infoCards.map((card) => (
            <div key={card.title} className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-xl font-bold">{card.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{card.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/reservation"
            className="rounded-md bg-primary px-6 py-3 text-sm font-bold uppercase tracking-widest text-primary-foreground"
          >
            Réserver
          </Link>
          <Link
            to="/contact"
            className="rounded-md border border-border px-6 py-3 text-sm font-bold uppercase tracking-widest transition-colors hover:border-primary"
          >
            Demander un devis
          </Link>
        </div>
      </section>
    </div>
  )
}