import { supabase } from './client'
import type { ReservationFormState, FileKey } from '../../types/reservation'
import { upsertUserProfile } from './profile'
import { functionErrorMessage } from '../../lib/functionErrors'

// Type à déclarer quand le navigateur n'en donne pas (photos HEIC notamment)
const TYPE_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  heic: 'image/heic', heif: 'image/heif', pdf: 'application/pdf',
}

async function uploadDocument(vehicleId: string, key: FileKey, file: File): Promise<string> {
  const extension = (file.name.split('.').pop() ?? '').toLowerCase()
  const path = `${vehicleId}/${Date.now()}-${key}.${extension}`

  const { error } = await supabase.storage
    .from('reservation-documents')
    .upload(path, file, { contentType: file.type || TYPE_BY_EXTENSION[extension] })

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
  const documentPaths: Partial<Record<FileKey, string>> = {}

  for (const key of Object.keys(form.files) as FileKey[]) {
    const file = form.files[key]
    if (file) {
      documentPaths[key] = await uploadDocument(vehicleId, key, file)
    } else if (form.existingDocumentPaths[key]) {
      documentPaths[key] = form.existingDocumentPaths[key]!
    }
  }

  // Le serveur recalcule le prix, vérifie les disponibilités et envoie les e-mails
  const { data, error } = await supabase.functions.invoke('create-reservation', {
    body: { vehicleId, documentPaths, form: { ...form, files: undefined, existingDocumentPaths: undefined } },
  })
  if (error) throw new Error(await functionErrorMessage(error))
  if (data?.error) throw new Error(data.error)
  const reservationId: string = data.reservationId

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