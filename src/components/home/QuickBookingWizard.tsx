import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVehicles } from '../../hooks/useVehicles'
import { useVehicleAvailability } from '../../hooks/useVehicleAvailability'
import { usePromotions } from '../../hooks/usePromotions'
import { useAuth } from '@/context/AuthContext'
import { ReservationProvider, useReservationForm } from '@/context/ReservationContext'
import { createReservation } from '@/services/supabase/reservations'
import { calculateDeliveryPrice } from '@/services/supabase/delivery'
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
import { pickupLocations } from '@/lib/pickupLocations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ProfileAutofill from '../reservation/ProfileAutofill'
import CarPlaceholder from '../vehicles/CarPlaceholder'
import PersonalInfoForm from '../reservation/PersonalInfoForm'
import DocumentsUpload from '../reservation/DocumentsUpload'
import type { DateRange } from 'react-day-picker'
import CautionChoice from '../reservation/CautionChoice'

type DurationId = '24h' | '3j' | 'semaine'

const DURATIONS: { id: DurationId; label: string; note: string; days: number }[] = [
  { id: '24h', label: '24 heures', note: 'Idéal pour un aller-retour', days: 1 },
  { id: '3j', label: '3 jours', note: 'Un week-end prolongé', days: 3 },
  { id: 'semaine', label: '1 semaine', note: '6 jours consécutifs', days: 6 },
]

const steps = ['Véhicule', 'Durée & date', 'Infos perso', 'Documents', 'Récapitulatif']

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDateFr(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function QuickBookingWizardInner() {
  const navigate = useNavigate()
  const { vehicles, isLoading: vehiclesLoading } = useVehicles()
  const { promotions } = usePromotions()
  const { form, updateField } = useReservationForm()
  const { user } = useAuth()

  const [step, setStep] = useState(0)
  const [vehicleId, setVehicleId] = useState<string | null>(null)
  const [duration, setDuration] = useState<DurationId | 'custom' | null>(null)
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [customRange, setCustomRange] = useState<DateRange | undefined>()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false)

  const vehicle = vehicles.find((v) => v.id === vehicleId) ?? null
  const { bookedRanges } = useVehicleAvailability(vehicleId)
  const bestPromo = vehicle ? getBestPromotion(vehicle.id, vehicle.pricePerDay, promotions) : null

  const effectiveStartDate = duration === 'custom' ? customRange?.from : startDate
  const effectiveEndDate = duration === 'custom'
    ? customRange?.to
    : startDate && duration ? addDays(startDate, DURATIONS.find((d) => d.id === duration)!.days) : null

  const rentalDays = effectiveStartDate && effectiveEndDate ? countRentalDays(effectiveStartDate, effectiveEndDate) : 0
  const isQuote = rentalDays > 0 && requiresQuote(rentalDays)
  const basePrice = vehicle && rentalDays > 0 && !isQuote ? basePriceForDays(vehicle, rentalDays) : null
  const discountedBase = applyPromotion(basePrice, bestPromo)
  const total = vehicle && rentalDays > 0 && !isQuote
    ? computeReservationTotal(vehicle, rentalDays, bestPromo, form.deliveryPrice)
    : null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const confirmDuration = () => {
    if (!effectiveStartDate || !effectiveEndDate || isQuote) return
    updateField('startDate', toISODate(effectiveStartDate))
    updateField('endDate', toISODate(effectiveEndDate))
    setStep(2)
  }

  const handleCalculateDelivery = async () => {
    if (!form.deliveryAddress.trim()) return
    setIsCalculatingDelivery(true)
    try {
      const { distanceKm, price: deliveryPrice } = await calculateDeliveryPrice(form.deliveryAddress)
      updateField('deliveryDistanceKm', distanceKm)
      updateField('deliveryPrice', deliveryPrice)
    } catch {
      // erreur silencieuse acceptable ici, le client peut réessayer
    } finally {
      setIsCalculatingDelivery(false)
    }
  }

  const handleSubmit = async () => {
    if (!vehicle || !form.cguAccepted) return

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
      <div id="reservation-rapide" className="mx-4 mb-4 rounded-xl bg-[#767776] p-8 text-center shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] sm:mx-6 md:mx-[90px]">
        <p className="text-lg font-bold text-primary">Réservation envoyée ✓</p>
        <p className="mt-2 text-sm text-white/80">
          Nous revenons vers vous rapidement pour confirmer votre location.
        </p>
      </div>
    )
  }

  return (
    <div id="reservation-rapide" className="mx-4 mb-4 rounded-xl bg-[#767776] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] sm:mx-6 md:mx-[90px] md:p-8">
      <ProfileAutofill />
      <p className="mb-6 text-center text-lg font-extrabold uppercase tracking-[0.16em] text-[#B8F000] md:text-xl">
        Réservez votre véhicule
      </p>

      <ol className="mb-6 grid grid-cols-5 gap-1.5">
        {steps.map((label, i) => (
          <li key={label} className="min-w-0">
            <div className={`h-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-white/30'}`} />
            <p className={`mt-1.5 truncate text-[9px] font-bold uppercase tracking-wider sm:text-[10px] ${i <= step ? 'text-primary' : 'text-white/60'}`}>
              {label}
            </p>
          </li>
        ))}
      </ol>

      {/* Étape 1 — Véhicule */}
      {step === 0 && (
        <div>
          {vehiclesLoading && <p className="text-sm text-white">Chargement des véhicules...</p>}
          {!vehiclesLoading && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setVehicleId(v.id)
                    setDuration(null)
                    setStartDate(undefined)
                    setCustomRange(undefined)
                    setStep(1)
                  }}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    vehicleId === v.id ? 'border-primary bg-white/10' : 'border-transparent bg-white/5 hover:border-primary/60'
                  }`}
                >
                  <div className="h-14 w-20 shrink-0 overflow-hidden rounded">
                    {v.imageUrl ? (
                      <img src={v.imageUrl} alt={v.name} className="h-full w-full object-cover" />
                    ) : (
                      <CarPlaceholder />
                    )}
                  </div>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">{v.name}</span>
                    <span className="block text-xs text-white/70">{v.category} · dès {v.pricePerDay} €/24h</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Étape 2 — Durée, lieu & date */}
      {step === 1 && vehicle && (
        <div>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {DURATIONS.map((d) => {
              const p = basePriceForDays(vehicle, d.days)
              const discounted = applyPromotion(p, bestPromo) ?? p
              return (
                <button
                  key={d.id}
                  onClick={() => { setDuration(d.id); setCustomRange(undefined) }}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    duration === d.id ? 'border-primary bg-white/10' : 'border-transparent bg-white/5 hover:border-primary/60'
                  }`}
                >
                  <span className="block text-sm font-semibold text-white">{d.label}</span>
                  <span className="block text-xs text-white/70">{d.note}</span>
                  <span className="mt-1.5 block text-lg font-bold text-primary">
                    {bestPromo && discounted !== p ? (
                      <>
                        <span className="mr-2 text-sm font-normal text-white/50 line-through">{p}€</span>
                        {discounted}€
                      </>
                    ) : (
                      `${p} €`
                    )}
                  </span>
                </button>
              )
            })}
          </div>

          <button
            onClick={() => { setDuration('custom'); setStartDate(undefined) }}
            className={`mb-4 w-full rounded-lg border p-3 text-left text-sm font-semibold transition-colors ${
              duration === 'custom' ? 'border-primary bg-white/10 text-white' : 'border-white/20 bg-white/5 text-white/80 hover:border-primary/60'
            }`}
          >
            📅 Dates différentes — choisir mes propres dates
          </button>

          <div className="mb-4">
            <Select value={form.pickupLocation} onValueChange={(value) => updateField('pickupLocation', value)}>
              <SelectTrigger className="w-full bg-white/5 py-6 text-base text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pickupLocations.map((loc) => (
                  <SelectItem key={loc.value} value={loc.value}>{loc.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.pickupLocation === 'livraison' && (
            <div className="mb-4">
              <div className="flex gap-2">
                <Input
                  value={form.deliveryAddress}
                  onChange={(e) => { updateField('deliveryAddress', e.target.value); updateField('deliveryPrice', null) }}
                  placeholder="Adresse de livraison"
                  className="bg-white/5 text-white"
                />
                <Button type="button" onClick={handleCalculateDelivery} disabled={isCalculatingDelivery}>
                  {isCalculatingDelivery ? '...' : 'Calculer'}
                </Button>
              </div>
              {form.deliveryPrice !== null && (
                <p className="mt-1.5 text-xs text-primary">{form.deliveryDistanceKm} km — {form.deliveryPrice} €</p>
              )}
            </div>
          )}

          {duration && duration !== 'custom' && (
            <div className="rounded-lg bg-white/5 p-3">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                disabled={[{ before: today }, ...bookedRanges.map((r) => ({ from: r.start, to: r.end }))]}
                className="mx-auto"
              />
            </div>
          )}

          {duration === 'custom' && (
            <div className="rounded-lg bg-white/5 p-3">
              <Calendar
                mode="range"
                selected={customRange}
                onSelect={setCustomRange}
                disabled={[{ before: today }, ...bookedRanges.map((r) => ({ from: r.start, to: r.end }))]}
                numberOfMonths={2}
                className="mx-auto"
              />
              {rentalDays > 0 && !isQuote && discountedBase !== null && (
                <p className="mt-2 text-center text-xs text-white/70">
                  {rentalDays} jour{rentalDays > 1 ? 's' : ''} — {discountedBase} €
                </p>
              )}
              {isQuote && (
                <div className="mt-3 rounded-lg border border-primary/40 bg-white/5 p-4 text-center">
                  <p className="text-sm font-semibold text-white">
                    Au-delà de {MAX_ONLINE_DAYS} jours, la location se fait sur devis
                  </p>
                  <p className="mt-1 text-xs text-white/70">
                    Décrivez-nous votre besoin, nous vous envoyons un tarif sur mesure.
                  </p>
                  <Button className="mt-3" onClick={() => navigate(`/contact?car=${vehicle.id}&longue=true`)}>
                    Demander un devis →
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Étape 3 — Infos perso */}
      {step === 2 && <PersonalInfoForm stepNumber={3} />}

      {/* Étape 4 — Documents */}
      {step === 3 && <DocumentsUpload stepNumber={4} />}

      {/* Étape 5 — Récapitulatif */}
      {step === 4 && vehicle && duration && effectiveStartDate && effectiveEndDate && basePrice !== null && total !== null && (
        <div className="rounded-lg bg-white/5 p-5">
          <dl className="space-y-2 text-sm text-white">
            <div className="flex justify-between gap-4">
              <dt className="text-white/70">Véhicule</dt>
              <dd className="font-semibold">{vehicle.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-white/70">Durée</dt>
              <dd className="font-semibold">{rentalDays} jour{rentalDays > 1 ? 's' : ''}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-white/70">Du</dt>
              <dd className="font-semibold">{formatDateFr(effectiveStartDate)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-white/70">Au</dt>
              <dd className="font-semibold">{formatDateFr(effectiveEndDate)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-white/70">Tarif ({describeRate(vehicle, rentalDays)})</dt>
              <dd className="font-semibold">
                {bestPromo && discountedBase !== basePrice ? (
                  <>
                    <span className="mr-2 font-normal text-white/50 line-through">{basePrice}€</span>
                    {discountedBase}€
                  </>
                ) : (
                  `${basePrice} €`
                )}
              </dd>
            </div>
            {form.deliveryPrice !== null && (
              <div className="flex justify-between gap-4">
                <dt className="text-white/70">Livraison ({form.deliveryDistanceKm} km)</dt>
                <dd className="font-semibold">{form.deliveryPrice} €</dd>
              </div>
            )}
            <div className="flex justify-between gap-4 border-t border-white/20 pt-2 text-base">
              <dt>Total de la location</dt>
              <dd className="font-bold text-primary">{total} €</dd>
            </div>
            <div className="flex justify-between gap-4 text-xs">
              <dt className="text-white/70">Acompte (50 %) à régler après validation</dt>
              <dd className="font-semibold">{computeDeposit(total)} €</dd>
            </div>
          </dl>
          
          {vehicle.depositAmount !== null && vehicle.depositAmount > 0 && (
            <CautionChoice amount={vehicle.depositAmount} tone="onGray" />
          )}
          
          <div className="my-4 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="cgu-wizard"
              checked={form.cguAccepted}
              onChange={(e) => updateField('cguAccepted', e.target.checked)}
              className="mt-0.5 accent-primary"
            />
            <label htmlFor="cgu-wizard" className="text-xs leading-relaxed text-white/80">
              J'accepte les <a href="/conditions-generales" target="_blank" rel="noreferrer" className="text-primary underline">conditions générales de location</a> et confirme l'exactitude des documents fournis.
            </label>
          </div>

          {submitError && <p className="mb-3 text-xs text-destructive-foreground">{submitError}</p>}

          <Button className="w-full" disabled={!form.cguAccepted || isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? 'Envoi en cours...' : 'Confirmer la réservation'}
          </Button>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-5 flex items-center justify-between">
        {step > 0 ? (
          <button onClick={() => setStep(step - 1)} className="text-xs font-semibold uppercase tracking-wider text-white/70 hover:text-white">
            ← Retour
          </button>
        ) : <span />}

        {step === 1 && duration && !isQuote && (duration === 'custom' ? customRange?.from && customRange?.to : startDate) && (
          <Button onClick={confirmDuration}>Continuer →</Button>
        )}
        {step === 2 && <Button onClick={() => setStep(3)}>Continuer →</Button>}
        {step === 3 && <Button onClick={() => setStep(4)}>Continuer →</Button>}
      </div>
    </div>
  )
}

export default function QuickBookingWizard() {
  return (
    <ReservationProvider>
      <QuickBookingWizardInner />
    </ReservationProvider>
  )
}