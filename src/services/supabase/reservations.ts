import { supabase } from './client'
import type { ReservationFormState, FileKey } from '../../types/reservation'
import { upsertUserProfile } from './profile'
import { getVehicleById } from './vehicles'
import { getActivePromotions } from './promotions'
import { computeReservationTotal, computeDeposit, countRentalDays, getBestPromotion } from '../../lib/pricing'

async function uploadDocument(vehicleId: string, key: FileKey, file: File): Promise<string> {
  const extension = file.name.split('.').pop()
  const path = `${vehicleId}/${Date.now()}-${key}.${extension}`

  const { error } = await supabase.storage
    .from('reservation-documents')
    .upload(path, file)

  if (error) {
    throw new Error(`Échec de l'envoi du document "${key}" : ${error.message}`)
  }

  return path
}

export async function createReservation(
  vehicleId: string,
  form: ReservationFormState,
  userId: string | null
): Promise<string> {
  const reservationId = crypto.randomUUID()
  const documentPaths: Partial<Record<FileKey, string>> = {}

  for (const key of Object.keys(form.files) as FileKey[]) {
    const file = form.files[key]
    if (file) {
      documentPaths[key] = await uploadDocument(vehicleId, key, file)
    } else if (form.existingDocumentPaths[key]) {
      documentPaths[key] = form.existingDocumentPaths[key]!
    }
  }

  // Prix figé au moment de la réservation
  const vehicle = await getVehicleById(vehicleId)
  const promotions = await getActivePromotions()
  const bestPromo = vehicle ? getBestPromotion(vehicleId, vehicle.pricePerDay, promotions) : null
  const days = countRentalDays(form.startDate, form.endDate)
  const totalPrice = vehicle ? computeReservationTotal(vehicle, days, bestPromo, form.deliveryPrice) : null
  const depositDue = totalPrice !== null ? computeDeposit(totalPrice) : null

  const { error } = await supabase
    .from('reservations')
    .insert({
      id: reservationId,
      vehicle_id: vehicleId,
      user_id: userId,
      first_name: form.firstName,
      last_name: form.lastName,
      birth_date: form.birthDate,
      phone: form.phone,
      email: form.email,
      address: form.address,
      city: form.city,
      postal_code: form.postalCode,
      country: form.country,
      license_number: form.licenseNumber,
      pickup_location: form.pickupLocation,
      start_date: form.startDate,
      end_date: form.endDate,
      delivery_address: form.deliveryAddress || null,
      delivery_price: form.deliveryPrice,
      total_price: totalPrice,
      deposit_due: depositDue,
      caution_amount: vehicle?.depositAmount ?? null,
      caution_method: vehicle?.depositAmount ? form.cautionMethod : null,
      permis_recto_path: documentPaths.permisRecto ?? null,
      permis_verso_path: documentPaths.permisVerso ?? null,
      cni_recto_path: documentPaths.cniRecto ?? null,
      cni_verso_path: documentPaths.cniVerso ?? null,
      justificatif_path: documentPaths.justificatif ?? null,
      cgu_accepted: form.cguAccepted,
    })

  if (error) {
    throw new Error(`Impossible d'enregistrer la réservation : ${error.message}`)
  }

  // Emails de notification — on ne bloque pas la réservation si ça échoue
  supabase.functions
    .invoke('send-reservation-email', { body: { reservationId } })
    .then(({ data, error: invokeError }) => {
      if (invokeError || data?.error) {
        console.error("Échec de l'envoi des emails :", invokeError ?? data?.error)
      } else if (data?.errors?.length) {
        console.error('Emails partiellement envoyés :', data.errors)
      }
    })

  if (userId) {
    try {
      await upsertUserProfile(
        userId,
        {
          firstName: form.firstName,
          lastName: form.lastName,
          birthDate: form.birthDate,
          phone: form.phone,
          address: form.address,
          city: form.city,
          postalCode: form.postalCode,
          country: form.country,
          licenseNumber: form.licenseNumber,
        },
        documentPaths
      )
    } catch (err) {
      console.error('Échec de la mise à jour du profil :', err)
    }
  }

  return reservationId
}

export interface ReservationRecord {
  id: string
  vehicleId: string
  startDate: string
  endDate: string
  status: string
  createdAt: string
  paymentStatus: string
  totalPrice: number | null
  depositDue: number | null
  cautionMethod: string | null
  cautionStatus: string
  cautionAmount: number | null
}

export async function getMyReservations(userId: string): Promise<ReservationRecord[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select(
      'id, vehicle_id, start_date, end_date, status, created_at, payment_status, total_price, deposit_due, caution_method, caution_status, caution_amount'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Impossible de récupérer vos réservations : ${error.message}`)
  }

  return data.map((row) => ({
    id: row.id,
    vehicleId: row.vehicle_id,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    createdAt: row.created_at,
    paymentStatus: row.payment_status,
    totalPrice: row.total_price,
    depositDue: row.deposit_due,
    cautionMethod: row.caution_method,
    cautionStatus: row.caution_status ?? 'none',
    cautionAmount: row.caution_amount,
  }))
}