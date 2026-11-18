import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createDepositRequest, getRequest } from './swikly.ts'

export type CautionOutcome =
  | { state: 'not_required' }
  | { state: 'secured' }
  | { state: 'released' }
  | { state: 'link'; link: string }

async function setStatus(supabaseAdmin: SupabaseClient, reservationId: string, status: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('reservations')
    .update({ caution_status: status })
    .eq('id', reservationId)
  if (error) throw new Error(`Mise à jour de la caution impossible : ${error.message}`)
}

export async function ensureCautionLink(supabaseAdmin: SupabaseClient, reservation: any): Promise<CautionOutcome> {
  if (reservation.caution_method !== 'online' || !reservation.caution_amount) {
    return { state: 'not_required' }
  }
  if (reservation.caution_status === 'released') return { state: 'released' }
  if (reservation.caution_status === 'accepted') return { state: 'secured' }

  if (reservation.swikly_id) {
    try {
      const existing = await getRequest(reservation.swikly_id)
      const status = existing.deposit?.status

      if (status === 'Accepted') {
        await setStatus(supabaseAdmin, reservation.id, 'accepted')
        return { state: 'secured' }
      }
      if (status === 'Released') {
        await setStatus(supabaseAdmin, reservation.id, 'released')
        return { state: 'released' }
      }
      if ((status === 'Pending' || status === 'Initialized' || status === 'Temporary') && existing.link) {
        return { state: 'link', link: existing.link }
      }
    } catch (err) {
      console.error('Demande Swikly existante illisible, création d\'une nouvelle :', err)
    }
  }

  const created = await createDepositRequest({
    reservationId: reservation.id,
    vehicleName: reservation.vehicles?.name ?? 'Véhicule',
    firstName: reservation.first_name,
    lastName: reservation.last_name,
    email: reservation.email,
    phone: reservation.phone,
    country: reservation.country,
    birthDate: reservation.birth_date,
    startDate: reservation.start_date,
    endDate: reservation.end_date,
    amountEuros: Number(reservation.caution_amount),
  })

  const { error } = await supabaseAdmin
    .from('reservations')
    .update({ caution_status: 'requested', swikly_id: created.id, caution_link: created.link })
    .eq('id', reservation.id)
  if (error) throw new Error(`Enregistrement de la caution impossible : ${error.message}`)

  return { state: 'link', link: created.link }
}