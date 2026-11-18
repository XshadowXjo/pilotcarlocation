import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { getBestPromotion, applyPromotion } from '@/lib/pricing'
import CarPlaceholder from './CarPlaceholder'
import type { Vehicle } from '@/types/vehicle'
import type { Promotion } from '@/types/promotion'

interface VehicleProductCardProps {
  vehicle: Vehicle
  promotions: Promotion[]
}

const priceColumns: { label: string; getValue: (v: Vehicle) => number | null }[] = [
  { label: '24h', getValue: (v) => v.pricePerDay },
  { label: '3 jours', getValue: (v) => v.priceThreeDays },
  { label: '1 semaine', getValue: (v) => v.pricePerWeek },
]

export default function VehicleProductCard({ vehicle, promotions }: VehicleProductCardProps) {
  const navigate = useNavigate()
  const [isExpanded, setIsExpanded] = useState(false)
  const bestPromo = getBestPromotion(vehicle.id, vehicle.pricePerDay, promotions)

  const specs = [
    vehicle.powerHp !== null && `${vehicle.powerHp} ch`,
    vehicle.transmission,
    vehicle.fuelType,
  ].filter((spec): spec is string => Boolean(spec))

  return (
    <div className="mx-auto w-full max-w-[85%] overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="relative md:w-2/5">
          {vehicle.imageUrl ? (
            <img src={vehicle.imageUrl} alt={vehicle.name} className="h-72 w-full object-cover md:h-full" />
          ) : (
            <div className="h-72 md:h-full">
              <CarPlaceholder />
            </div>
          )}
          {bestPromo && (
            <span className="absolute left-3 top-3 rounded bg-red-500 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-white">
              {bestPromo.discountType === 'percentage' ? `-${bestPromo.discountValue}%` : `-${bestPromo.discountValue}€`}
            </span>
          )}
        </div>

        {/* Contenu principal */}
        <div className="flex-1 p-7 md:p-10">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-extrabold text-card-foreground">{vehicle.name}</h2>
            <span className="rounded-full border border-primary/50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              {vehicle.category}
            </span>
          </div>

          {specs.length > 0 && (
            <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {specs.map((spec) => (
                <li key={spec}>{spec}</li>
              ))}
            </ul>
          )}

          <div className="mb-5 flex items-baseline gap-2">
            <span className="text-sm text-muted-foreground">À partir de</span>
            {bestPromo && applyPromotion(vehicle.pricePerDay, bestPromo) !== vehicle.pricePerDay ? (
              <>
                <span className="text-sm text-muted-foreground line-through">{vehicle.pricePerDay}€</span>
                <span className="text-3xl font-black text-card-foreground">{applyPromotion(vehicle.pricePerDay, bestPromo)}€</span>
              </>
            ) : (
              <span className="text-3xl font-black text-card-foreground">{vehicle.pricePerDay}€</span>
            )}
            <span className="text-sm text-muted-foreground">/ jour</span>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate(`/reservation/${vehicle.id}`)}>Réserver</Button>
            <Button variant="outline" onClick={() => setIsExpanded((v) => !v)}>
              {isExpanded ? 'Masquer les détails ▴' : 'Voir tous les détails ▾'}
            </Button>
          </div>

          {isExpanded && (
            <div className="mt-6 space-y-5 border-t border-border pt-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tarifs</p>
                <dl className="grid grid-cols-3 gap-3 text-center">
                  {priceColumns.map((col) => {
                    const value = col.getValue(vehicle)
                    const discounted = applyPromotion(value, bestPromo)
                    return (
                      <div key={col.label} className="rounded-md border border-border bg-muted px-3 py-2.5">
                        <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{col.label}</dt>
                        <dd className="text-sm font-bold text-card-foreground">
                          {value === null ? (
                            '—'
                          ) : bestPromo && discounted !== value ? (
                            <>
                              <span className="mr-1 text-xs font-normal text-muted-foreground line-through">{value}€</span>
                              {discounted}€
                            </>
                          ) : (
                            `${value}€`
                          )}
                        </dd>
                      </div>
                    )
                  })}
                </dl>
              </div>

              {vehicle.depositAmount !== null && (
                <p className="text-sm text-muted-foreground">
                  Caution : <span className="font-semibold text-card-foreground">{vehicle.depositAmount}€</span>
                </p>
              )}

              {vehicle.options.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Options incluses</p>
                  <ul className="flex flex-wrap gap-2">
                    {vehicle.options.map((option) => (
                      <li key={option} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                        {option}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}