import { supabase } from './client'
import { getVehicleById } from './vehicles'
import { getActivePromotions } from './promotions'
import { computeReservationTotal, computeDeposit, countRentalDays, getBestPromotion } from '../../lib/pricing'

export async function requestExtension(originalReservationId: string, newEndDate: string): Promise<string> {
  const { data: original, error: fetchError } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', originalReservationId)
    .single()

  if (fetchError || !original) {
    throw new Error(`Réservation d'origine introuvable : ${fetchError?.message}`)
  }

  const newStart = new Date(original.end_date)
  newStart.setDate(newStart.getDate() + 1)
  const startDate = newStart.toISOString().slice(0, 10)

  const vehicle = await getVehicleById(original.vehicle_id)
  const promotions = await getActivePromotions()
  const bestPromo = vehicle ? getBestPromotion(vehicle.id, vehicle.pricePerDay, promotions) : null
  const extraDays = countRentalDays(original.end_date, newEndDate)
  const totalPrice = vehicle ? computeReservationTotal(vehicle, extraDays, bestPromo, null) : null

  const newId = crypto.randomUUID()

  const { error } = await supabase.from('reservations').insert({
    id: newId,
    vehicle_id: original.vehicle_id,
    user_id: original.user_id,
    first_name: original.first_name,
    last_name: original.last_name,
    birth_date: original.birth_date,
    phone: original.phone,
    email: original.email,
    address: original.address,
    city: original.city,
    postal_code: original.postal_code,
    country: original.country,
    license_number: original.license_number,
    pickup_location: original.pickup_location,
    start_date: startDate,
    end_date: newEndDate,
    total_price: totalPrice,
    deposit_due: totalPrice !== null ? computeDeposit(totalPrice) : null,
    permis_recto_path: original.permis_recto_path,
    permis_verso_path: original.permis_verso_path,
    cni_recto_path: original.cni_recto_path,
    cni_verso_path: original.cni_verso_path,
    justificatif_path: original.justificatif_path,
    cgu_accepted: true,
    status: 'pending',
    parent_reservation_id: original.id,
  })

  if (error) throw new Error(`Impossible de créer la demande de prolongation : ${error.message}`)

  supabase.functions
    .invoke('send-reservation-email', { body: { reservationId: newId } })
    .then(({ data, error: invokeError }) => {
      if (invokeError || data?.error) {
        console.error("Échec de l'envoi des emails :", invokeError ?? data?.error)
      }
    })

  return newId
}