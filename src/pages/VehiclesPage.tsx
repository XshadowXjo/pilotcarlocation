import { useVehicles } from '../hooks/useVehicles'
import { usePromotions } from '../hooks/usePromotions'
import VehicleProductCard from '../components/vehicles/VehicleProductCard'

export default function VehiclesPage() {
  const { vehicles, isLoading, error } = useVehicles()
  const { promotions } = usePromotions()

  return (
    <div className="bg-background py-10 text-foreground">
      <h1 className="mb-8 text-center text-2xl font-black text-black uppercase tracking-tight sm:text-3xl">
        Nos Véhicules
      </h1>

      {isLoading && <p className="text-center text-sm text-muted-foreground">Chargement des véhicules...</p>}
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
      {!isLoading && !error && vehicles.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">Aucun véhicule disponible pour le moment.</p>
      )}

      <div className="space-y-6">
        {vehicles.map((vehicle) => (
          <VehicleProductCard key={vehicle.id} vehicle={vehicle} promotions={promotions} />
        ))}
      </div>
    </div>
  )
}