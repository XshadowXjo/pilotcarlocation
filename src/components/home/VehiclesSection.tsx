import { useVehicles } from '../../hooks/useVehicles'
import { usePromotions } from '../../hooks/usePromotions'
import VehicleCard from '../vehicles/VehicleCard'

export default function VehiclesSection() {
  const { vehicles, isLoading, error } = useVehicles()
  const { promotions } = usePromotions()

  return (
    <section id="vehicules" className="px-6 py-5 md:px-[90px]">      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="text-2xl font-black uppercase leading-tight tracking-tight text-black sm:text-[28px]">
          Nos Véhicules
        </h2>
        <button className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#4A4C50] transition-colors hover:text-[#17181A]">
          Voir tous →
        </button>
      </div>

      {isLoading && (
        <p className="text-center text-sm text-muted-foreground">
          Chargement des véhicules...
        </p>
      )}

      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}

      {!isLoading && !error && vehicles.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Aucun véhicule disponible pour le moment.
        </p>
      )}

      {!isLoading && !error && vehicles.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} promotions={promotions} />
          ))}
        </div>
      )}
    </section>
  )
}