import { corsHeaders, json, errorResponse, createAdminClient, requireAdmin, HttpError } from '../_shared/http.ts'
import { sendReservationEmails } from '../_shared/reservationEmails.ts'

const supabaseAdmin = createAdminClient()

// Renvoi manuel des e-mails d'une réservation. Réservé aux administrateurs :
// l'envoi normal est fait directement par la fonction create-reservation.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    await requireAdmin(supabaseAdmin, req)
    const { reservationId } = await req.json()
    if (!reservationId) throw new HttpError(400, 'Réservation manquante')

    const result = await sendReservationEmails(supabaseAdmin, reservationId)
    if (!result.adminEmailSent && !result.clientEmailSent) throw new Error(result.errors.join(' | '))
    return json({ success: true, ...result })
  } catch (err) {
    return errorResponse(err)
  }
})
