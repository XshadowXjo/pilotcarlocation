import { useState } from 'react'
import { useReservationForm } from '@/context/ReservationContext'
import { createReservation } from '@/services/supabase/reservations'
import { Button } from '@/components/ui/button'
import type { Vehicle } from '@/types/vehicle'

interface VehicleSummaryProps {
  vehicle: Vehicle
}

function daysBetween(start: string, end: string): number {
  if (!start || !end) return 0
  const diff = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)))
}

export default function VehicleSummary({ vehicle }: VehicleSummaryProps) {
  const { form, updateField } = useReservationForm()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const days = daysBetween(form.startDate, form.endDate)
  const total = days > 0 ? vehicle.pricePerDay * days : null

  const handleSubmit = async () => {
    if (!form.cguAccepted) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await createReservation(vehicle.id, form)
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
      {/* ... photo, nom, catégorie, options, specs : inchangé ... */}

      <div className="my-[18px] h-px bg-border" />

      {total !== null ? (
        <>
          <div className="mb-2.5 flex justify-between text-[13px] text-muted-foreground">
            <span>Tarif journalier</span><span className="text-foreground">{vehicle.pricePerDay} €</span>
          </div>
          <div className="mb-2.5 flex justify-between text-[13px] text-muted-foreground">
            <span>Nombre de jours</span><span className="text-foreground">{days}</span>
          </div>
          <div className="my-[18px] h-px bg-border" />
          <div className="flex justify-between text-base font-bold uppercase tracking-wide">
            <span>Total à payer</span><span className="text-primary">{total} €</span>
          </div>
        </>
      ) : (
        <p className="text-[13px] text-muted-foreground">
          Renseignez vos dates pour voir le tarif total.
        </p>
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
          J'accepte les <a href="#" className="text-primary">conditions générales de location</a> et confirme l'exactitude des documents fournis.
        </label>
      </div>

      {submitError && (
        <p className="mb-3 text-xs text-destructive">{submitError}</p>
      )}

      <Button className="w-full" disabled={!form.cguAccepted || isSubmitting} onClick={handleSubmit}>
        {isSubmitting ? 'Envoi en cours...' : 'Confirmer la réservation'}
      </Button>
    </div>
  )
}