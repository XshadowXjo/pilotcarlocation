import type { Promotion } from '../types/promotion'
import type { Vehicle } from '../types/vehicle'

type PricedVehicle = Pick<Vehicle, 'pricePerDay' | 'priceThreeDays' | 'pricePerWeek'>

export const THREE_DAYS_FORFAIT_DAYS = 3
export const WEEK_FORFAIT_DAYS = 6
export const MAX_ONLINE_DAYS = 6
export const DEPOSIT_RATE = 0.5

// Nombre de jours facturés : écart entre les dates, minimum 1
export function countRentalDays(start: string | Date, end: string | Date): number {
  const diff = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)))
}

// Au-delà de 6 jours : pas de tarif automatique, la location se fait sur devis
export function requiresQuote(days: number): boolean {
  return days > MAX_ONLINE_DAYS
}

export function basePriceForDays(vehicle: PricedVehicle, days: number): number {
  if (days === THREE_DAYS_FORFAIT_DAYS && vehicle.priceThreeDays !== null) return vehicle.priceThreeDays
  if (days === WEEK_FORFAIT_DAYS && vehicle.pricePerWeek !== null) return vehicle.pricePerWeek
  return vehicle.pricePerDay * days
}

export function describeRate(vehicle: PricedVehicle, days: number): string {
  if (days === THREE_DAYS_FORFAIT_DAYS && vehicle.priceThreeDays !== null) return 'forfait 3 jours'
  if (days === WEEK_FORFAIT_DAYS && vehicle.pricePerWeek !== null) return 'forfait semaine'
  return `${vehicle.pricePerDay} € × ${days} j`
}

function discountAmount(price: number, promo: Promotion): number {
  return promo.discountType === 'percentage' ? price * (promo.discountValue / 100) : promo.discountValue
}

export function getBestPromotion(
  vehicleId: string,
  referencePrice: number,
  promotions: Promotion[]
): Promotion | null {
  const applicable = promotions.filter(
    (p) => p.appliesToAllVehicles || p.vehicleIds.includes(vehicleId)
  )
  if (applicable.length === 0) return null

  return applicable.reduce((best, current) =>
    discountAmount(referencePrice, current) > discountAmount(referencePrice, best) ? current : best
  )
}

export function applyPromotion(price: number | null, promo: Promotion | null): number | null {
  if (price === null || !promo) return price
  const discounted =
    promo.discountType === 'percentage' ? price * (1 - promo.discountValue / 100) : price - promo.discountValue
  return Math.max(0, Math.round(discounted))
}

// Prix de base (forfait ou journalier) → promotion → livraison ajoutée en dernier.
// Refuse les durées sur devis : l'interface doit les traiter avant d'appeler cette fonction.
export function computeReservationTotal(
  vehicle: PricedVehicle,
  days: number,
  promo: Promotion | null,
  deliveryPrice: number | null
): number {
  if (requiresQuote(days)) {
    throw new Error(`Au-delà de ${MAX_ONLINE_DAYS} jours, la location se fait sur devis. Merci de nous contacter.`)
  }
  const base = basePriceForDays(vehicle, days)
  const discounted = applyPromotion(base, promo) ?? base
  return discounted + (deliveryPrice ?? 0)
}

export function computeDeposit(total: number): number {
  return Math.round(total * DEPOSIT_RATE)
}