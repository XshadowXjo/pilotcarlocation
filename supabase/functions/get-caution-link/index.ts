import { corsHeaders, json, errorResponse, createAdminClient, requireUser, HttpError } from '../_shared/http.ts'
import { ensureCautionLink } from '../_shared/caution.ts'

const supabaseAdmin = createAdminClient()

// Lien de caution Swikly, demandé par le client depuis son espace
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const user = await requireUser(supabaseAdmin, req)
    const { reservationId } = await req.json()

    const { data: reservation } = await supabaseAdmin
      .from('reservations')
      .select('*, vehicles(name)')
      .eq('id', reservationId)
      .maybeSingle()

    if (!reservation || reservation.user_id !== user.id) throw new HttpError(404, 'Réservation introuvable')
    if (reservation.status !== 'confirmed') throw new HttpError(400, "La réservation n'est pas confirmée")

    const outcome = await ensureCautionLink(supabaseAdmin, reservation)
    if (outcome.state === 'link') return json({ url: outcome.link })
    if (outcome.state === 'secured') return json({ alreadySecured: true })
    if (outcome.state === 'released') return json({ released: true })
    throw new HttpError(400, 'Aucune caution en ligne pour cette réservation')
  } catch (err) {
    return errorResponse(err)
  }
})
