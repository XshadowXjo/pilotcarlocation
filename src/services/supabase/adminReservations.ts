import { supabase } from './client'
import type { FileKey } from '../../types/reservation'

export const DOCUMENT_LABELS: Record<FileKey, string> = {
  permisRecto: 'Permis (recto)',
  permisVerso: 'Permis (verso)',
  cniRecto: 'CNI (recto)',
  cniVerso: 'CNI (verso)',
  justificatif: 'Justificatif de domicile',
}

export interface AdminReservation {
  id: string
  vehicleName: string
  firstName: string
  lastName: string
  email: string
  phone: string
  pickupLocation: string
  startDate: string
  endDate: string
  status: string
  paymentStatus: string
  cautionMethod: string | null
  cautionAmount: number | null
  cautionStatus: string
  createdAt: string
  isExtension: boolean
  documentPaths: Partial<Record<FileKey, string>>
}

function mapRowToAdminReservation(row: any): AdminReservation {
  return {
    id: row.id,
    vehicleName: row.vehicles?.name ?? 'Véhicule',
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    pickupLocation: row.pickup_location,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    paymentStatus: row.payment_status,
    cautionMethod: row.caution_method,
    cautionAmount: row.caution_amount,
    cautionStatus: row.caution_status ?? 'none',
    createdAt: row.created_at,
    isExtension: !!row.parent_reservation_id,
    documentPaths: {
      permisRecto: row.permis_recto_path ?? undefined,
      permisVerso: row.permis_verso_path ?? undefined,
      cniRecto: row.cni_recto_path ?? undefined,
      cniVerso: row.cni_verso_path ?? undefined,
      justificatif: row.justificatif_path ?? undefined,
    },
  }
}

export async function getAllReservationsForAdmin(): Promise<AdminReservation[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select('*, vehicles(name)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Impossible de récupérer les réservations : ${error.message}`)

  const reservations = data.map(mapRowToAdminReservation)

  // Les "pending" en premier, puis le reste par date décroissante (déjà trié par la requête)
  return reservations.sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1
    if (a.status !== 'pending' && b.status === 'pending') return 1
    return 0
  })
}

export async function updateReservationStatus(id: string, status: 'confirmed' | 'cancelled'): Promise<void> {
  const { error } = await supabase.from('reservations').update({ status }).eq('id', id)
  if (error) throw new Error(`Impossible de mettre à jour le statut : ${error.message}`)
}

export async function getSignedDocumentUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('reservation-documents')
    .createSignedUrl(path, 60 * 60) // 1h

  if (error) throw new Error(`Impossible de générer le lien : ${error.message}`)
  return data.signedUrl
}