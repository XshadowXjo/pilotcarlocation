import { corsHeaders, json, errorResponse, createAdminClient, requireUser, HttpError } from '../_shared/http.ts'
import { stripe, createDepositCheckout } from '../_shared/stripe.ts'

const supabaseAdmin = createAdminClient()

// Lien de paiement de l'acompte, demandé par le client depuis son espace
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
    if (reservation.payment_status === 'deposit_paid') return json({ alreadyPaid: true })

    // Session existante : on la réutilise si elle est encore ouverte
    if (reservation.stripe_session_id) {
      try {
        const existing = await stripe.checkout.sessions.retrieve(reservation.stripe_session_id)
        if (existing.payment_status === 'paid') {
          await supabaseAdmin.from('reservations').update({ payment_status: 'deposit_paid' }).eq('id', reservationId)
          return json({ alreadyPaid: true })
        }
        if (existing.status === 'open' && existing.url) return json({ url: existing.url })
      } catch (err) {
        console.error("Session existante illisible, création d'une nouvelle :", err)
      }
    }

    return json({ url: await createDepositCheckout(supabaseAdmin, reservation) })
  } catch (err) {
    return errorResponse(err)
  }
})
