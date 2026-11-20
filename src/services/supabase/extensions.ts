import { supabase } from './client'
import { functionErrorMessage } from '../../lib/functionErrors'

// Le serveur vérifie que la réservation appartient au client, que les dates sont libres,
// et calcule le prix de la prolongation.
export async function requestExtension(originalReservationId: string, newEndDate: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('create-reservation', {
    body: { parentReservationId: originalReservationId, newEndDate },
  })
  if (error) throw new Error(await functionErrorMessage(error))
  if (data?.error) throw new Error(data.error)
  return data.reservationId
}
