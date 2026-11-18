import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import CarPlaceholder from './CarPlaceholder'
import { getBestPromotion, applyPromotion } from '@/lib/pricing'
import type { Promotion } from '@/types/promotion'
import type { Vehicle } from '@/types/vehicle'

interface VehicleCardProps {
  vehicle: Vehicle
  promotions: Promotion[]
}

const priceColumns: { label: string; getValue: (v: Vehicle) => number | null }[] = [
  { label: '24h', getValue: (v) => v.pricePerDay },
  { label: '3j', getValue: (v) => v.priceThreeDays },
  { label: 'Semaine', getValue: (v) => v.pricePerWeek },
]

export default function VehicleCard({ vehicle, promotions }: VehicleCardProps) {
  const navigate = useNavigate()
  const bestPromo = getBestPromotion(vehicle.id, vehicle.pricePerDay, promotions)

  const specs = [
    vehicle.powerHp !== null && `${vehicle.powerHp} ch`,
    vehicle.transmission,
    vehicle.fuelType,
  ].filter((spec): spec is string => Boolean(spec))

  return (
    <div
      className={`overflow-hidden rounded-lg bg-card transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl ${
        vehicle.featured ? 'outline-3 outline-accent' : ''
      }`}
    >
      <div className="relative">
        {vehicle.imageUrl ? (
          <img
            src={vehicle.imageUrl}
            alt={vehicle.name}
            className="aspect-[3/2] w-full object-cover"
          />
        ) : (
          <CarPlaceholder />
        )}
        {vehicle.featured && (
          <span className="absolute bottom-2.5 right-2.5 rounded bg-accent px-2 py-1 text-[8px] font-extrabold uppercase tracking-wider text-accent-foreground">
            Featured
          </span>
        )}
        {bestPromo && (
          <span className="absolute left-2.5 top-2.5 rounded bg-red-500 px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-white">
            {bestPromo.discountType === 'percentage' ? `-${bestPromo.discountValue}%` : `-${bestPromo.discountValue}€`}
          </span>
        )}
      </div>

      <div className="p-4 pb-[18px]">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="truncate text-base font-extrabold text-card-foreground sm:text-lg">
            {vehicle.name}
          </div>
          <span className="shrink-0 rounded-full border border-primary/50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            {vehicle.category}
          </span>
        </div>

        {specs.length > 0 && (
          <ul className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {specs.map((spec) => (
              <li key={spec}>{spec}</li>
            ))}
          </ul>
        )}

        <dl className="mb-3 grid grid-cols-3 gap-1.5 border-y border-border py-3 text-center">
          {priceColumns.map((col) => {
            const value = col.getValue(vehicle)
            const discounted = applyPromotion(value, bestPromo)
            return (
              <div key={col.label}>
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {col.label}
                </dt>
                <dd className="text-base font-bold text-card-foreground">
                  {value === null ? (
                    '—'
                  ) : bestPromo && discounted !== value ? (
                    <>
                      <span className="mr-1 text-xs font-normal text-muted-foreground line-through">{value}€</span>
                      <span className="text-primary">{discounted}€</span>
                    </>
                  ) : (
                    `${value} €`
                  )}
                </dd>
              </div>
            )
          })}
        </dl>

        {vehicle.depositAmount !== null && (
          <p className="mb-3 text-sm text-muted-foreground">
            Caution : <span className="font-semibold text-card-foreground">{vehicle.depositAmount} €</span>
          </p>
        )}

        <Button className="w-full" onClick={() => navigate(`/reservation/${vehicle.id}`)}>
          Réserver
        </Button>
      </div>
    </div>
  )
}