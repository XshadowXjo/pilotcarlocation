import { corsHeaders, json, errorResponse, createAdminClient, requireAdmin, HttpError } from '../_shared/http.ts'
import { getRequest, releaseRequest } from '../_shared/swikly.ts'

const supabaseAdmin = createAdminClient()

// Libération de la caution Swikly après la restitution du véhicule. Réservé aux administrateurs.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    await requireAdmin(supabaseAdmin, req)

    const { reservationId } = await req.json()
    if (!reservationId) throw new HttpError(400, 'Réservation manquante')

    const { data: reservation, error } = await supabaseAdmin
      .from('reservations')
      .select('id, swikly_id, caution_method, caution_status')
      .eq('id', reservationId)
      .maybeSingle()
    if (error) throw new Error(`Lecture de la réservation impossible : ${error.message}`)
    if (!reservation) throw new HttpError(404, 'Réservation introuvable')
    if (reservation.caution_method !== 'online' || !reservation.swikly_id) {
      throw new HttpError(400, "Aucune caution en ligne pour cette réservation")
    }
    if (reservation.caution_status === 'released') return json({ released: true })

    // Swikly fait foi : on ne libère que ce qui est réellement bloqué chez eux
    const existing = await getRequest(reservation.swikly_id)
    const status = existing.deposit?.status
    if (status !== 'Released') {
      if (status !== 'Accepted') {
        throw new HttpError(400, `La caution n'est pas active chez Swikly (statut : ${status ?? 'inconnu'})`)
      }
      await releaseRequest(reservation.swikly_id)
    }

    const { error: updateError } = await supabaseAdmin
      .from('reservations')
      .update({ caution_status: 'released' })
      .eq('id', reservationId)
    if (updateError) throw new Error(`Caution libérée mais statut non enregistré : ${updateError.message}`)

    return json({ released: true })
  } catch (err) {
    return errorResponse(err)
  }
})
