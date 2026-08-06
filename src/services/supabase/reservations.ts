import { supabase } from './client'
import type { ReservationFormState, FileKey } from '../../types/reservation'

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

export async function createReservation(vehicleId: string, form: ReservationFormState): Promise<string> {
  const reservationId = crypto.randomUUID()
  const documentPaths: Partial<Record<FileKey, string>> = {}

  for (const [key, file] of Object.entries(form.files) as [FileKey, File | null][]) {
    if (file) {
      documentPaths[key] = await uploadDocument(vehicleId, key, file)
    }
  }

  const { error } = await supabase
    .from('reservations')
    .insert({
      id: reservationId,
      vehicle_id: vehicleId,
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

  return reservationId
}