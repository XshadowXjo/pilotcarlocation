import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useReservationForm } from '@/context/ReservationContext'
import { usePromotions } from '../../hooks/usePromotions'
import { createReservation } from '@/services/supabase/reservations'
import {
  getBestPromotion,
  applyPromotion,
  basePriceForDays,
  computeReservationTotal,
  computeDeposit,
  countRentalDays,
  describeRate,
  requiresQuote,
  MAX_ONLINE_DAYS,
} from '@/lib/pricing'
import { Button } from '@/components/ui/button'
import type { Vehicle } from '@/types/vehicle'
import CautionChoice from './CautionChoice'

interface VehicleSummaryProps {
  vehicle: Vehicle
}

export default function VehicleSummary({ vehicle }: VehicleSummaryProps) {
  const { form, updateField } = useReservationForm()
  const { user } = useAuth()
  const { promotions } = usePromotions()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const hasDates = !!form.startDate && !!form.endDate
  const days = hasDates ? countRentalDays(form.startDate, form.endDate) : 0
  const isQuote = days > 0 && requiresQuote(days)
  const bestPromo = getBestPromotion(vehicle.id, vehicle.pricePerDay, promotions)
  const basePrice = days > 0 && !isQuote ? basePriceForDays(vehicle, days) : null
  const discountedBase = basePrice !== null ? applyPromotion(basePrice, bestPromo) : null
  const total = days > 0 && !isQuote ? computeReservationTotal(vehicle, days, bestPromo, form.deliveryPrice) : null

  const specs = [
    vehicle.powerHp !== null && { val: `${vehicle.powerHp} ch`, lbl: 'Puissance' },
    vehicle.transmission && { val: vehicle.transmission, lbl: 'Boîte' },
    vehicle.fuelType && { val: vehicle.fuelType, lbl: 'Carburant' },
    vehicle.depositAmount !== null && { val: `${vehicle.depositAmount} €`, lbl: 'Caution' },
  ].filter((spec): spec is { val: string; lbl: string } => Boolean(spec))

  const handleSubmit = async () => {
    if (!form.cguAccepted || total === null) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await createReservation(vehicle.id, form, user?.id ?? null)
      setIsSubmitted(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="rounded-[10px] border border-border bg-card p-7 text-center">
        <p className="text-lg font-bold text-primary">Réservation envoyée ✓</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Nous revenons vers vous rapidement pour confirmer votre location.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-[10px] border border-border bg-card p-7 lg:sticky lg:top-24">
      <div className="mb-4 h-[150px] w-full overflow-hidden rounded-lg border border-border bg-gradient-to-br from-[#0c0c0c] to-[#2a2a2a]">
        {vehicle.imageUrl && (
          <img src={vehicle.imageUrl} alt={vehicle.name} className="h-full w-full object-cover" />
        )}
      </div>

      <div className="mb-[14px] text-xs font-semibold tracking-wide text-primary">{vehicle.category}</div>
      <div className="text-xl font-bold leading-snug">{vehicle.name}</div>

      {vehicle.options.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {vehicle.options.map((option) => (
            <li key={option} className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
              {option}
            </li>
          ))}
        </ul>
      )}

      {specs.length > 0 && (
        <div className="my-[18px] grid grid-cols-2 gap-3">
          {specs.map((spec) => (
            <div key={spec.lbl} className="rounded-md border border-border bg-[#1a1a1a] px-3 py-2.5">
              <div className="text-[15px] font-bold">{spec.val}</div>
              <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{spec.lbl}</div>
            </div>
          ))}
        </div>
      )}

      <div className="my-[18px] h-px bg-border" />

      {isQuote ? (
        <div className="rounded-lg border border-primary/40 bg-background p-4 text-center">
          <p className="text-sm font-semibold">
            Au-delà de {MAX_ONLINE_DAYS} jours, la location se fait sur devis
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Décrivez-nous votre besoin, nous vous envoyons un tarif sur mesure.
          </p>
          <Link to={`/contact?car=${vehicle.id}&longue=true`}>
            <Button className="mt-3">Demander un devis →</Button>
          </Link>
        </div>
      ) : total !== null && basePrice !== null ? (
        <>
          <div className="mb-2.5 flex justify-between text-[13px] text-muted-foreground">
            <span>Durée</span>
            <span className="text-foreground">{days} jour{days > 1 ? 's' : ''}</span>
          </div>
          <div className="mb-2.5 flex justify-between text-[13px] text-muted-foreground">
            <span>Tarif ({describeRate(vehicle, days)})</span>
            <span className="text-foreground">
              {bestPromo && discountedBase !== basePrice ? (
                <>
                  <span className="mr-1.5 text-muted-foreground line-through">{basePrice}€</span>
                  {discountedBase}€
                </>
              ) : (
                `${basePrice} €`
              )}
            </span>
          </div>
          {form.deliveryPrice !== null && (
            <div className="mb-2.5 flex justify-between text-[13px] text-muted-foreground">
              <span>Livraison ({form.deliveryDistanceKm} km)</span>
              <span className="text-foreground">{form.deliveryPrice} €</span>
            </div>
          )}
          <div className="my-[18px] h-px bg-border" />
          <div className="flex justify-between text-base font-bold uppercase tracking-wide">
            <span>Total de la location</span>
            <span className="text-primary">{total} €</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Acompte de {computeDeposit(total)} € (50 %) à régler une fois votre réservation validée.
          </p>
        </>
      ) : (
        <p className="text-[13px] text-muted-foreground">
          Renseignez vos dates pour voir le tarif total.
        </p>
      )}
      {vehicle.depositAmount !== null && vehicle.depositAmount > 0 && (
        <CautionChoice amount={vehicle.depositAmount} />
      )}

      <div className="my-4 flex items-start gap-2.5">
        <input
          type="checkbox"
          id="cgu"
          checked={form.cguAccepted}
          onChange={(e) => updateField('cguAccepted', e.target.checked)}
          className="mt-0.5 accent-primary"
        />
        <label htmlFor="cgu" className="text-xs leading-relaxed text-muted-foreground">
          J'accepte les <a href="/conditions-generales" target="_blank" rel="noreferrer" className="text-primary underline">conditions générales de location</a> et confirme l'exactitude des documents fournis.
        </label>
      </div>

      {submitError && <p className="mb-3 text-xs text-destructive">{submitError}</p>}

      <Button className="w-full" disabled={!form.cguAccepted || isSubmitting || total === null} onClick={handleSubmit}>
        {isSubmitting ? 'Envoi en cours...' : 'Confirmer la réservation'}
      </Button>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Vos documents sont chiffrés et utilisés uniquement pour la vérification de votre dossier de location.
      </p>
    </div>
  )
}