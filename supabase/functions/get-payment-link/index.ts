import Stripe from 'npm:stripe@17'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  httpClient: Stripe.createFetchHttpClient(),
})
const SITE_URL = Deno.env.get('SITE_URL')!

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !userData.user) return json({ error: 'Connexion requise' }, 401)

    const { reservationId } = await req.json()

    const { data: reservation, error } = await supabaseAdmin
      .from('reservations')
      .select('*, vehicles(name)')
      .eq('id', reservationId)
      .single()

    if (error || !reservation) return json({ error: 'Réservation introuvable' }, 404)
    if (reservation.user_id !== userData.user.id) return json({ error: 'Accès refusé' }, 403)
    if (reservation.status !== 'confirmed') return json({ error: "La réservation n'est pas confirmée" }, 400)
    if (reservation.payment_status === 'deposit_paid') return json({ alreadyPaid: true })
    if (!reservation.deposit_due) return json({ error: "Aucun montant d'acompte calculé pour cette réservation" }, 400)

    // Session existante : on la réutilise si elle est encore ouverte
    if (reservation.stripe_session_id) {
      try {
        const existing = await stripe.checkout.sessions.retrieve(reservation.stripe_session_id)

        if (existing.payment_status === 'paid') {
          await supabaseAdmin
            .from('reservations')
            .update({ payment_status: 'deposit_paid' })
            .eq('id', reservationId)
          return json({ alreadyPaid: true })
        }

        if (existing.status === 'open' && existing.url) {
          return json({ url: existing.url })
        }
      } catch (err) {
        console.error('Session existante illisible, création d\'une nouvelle :', err)
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: reservation.email,
      line_items: [{
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(reservation.deposit_due * 100),
          product_data: {
            name: `Acompte — ${reservation.vehicles?.name ?? 'Location'} (${reservation.start_date} au ${reservation.end_date})`,
          },
        },
        quantity: 1,
      }],
      success_url: `${SITE_URL}/paiement/succes`,
      cancel_url: `${SITE_URL}/paiement/annule`,
      metadata: { reservation_id: reservationId },
    })

    const { error: updateError } = await supabaseAdmin
      .from('reservations')
      .update({ stripe_session_id: session.id, stripe_payment_link: session.url })
      .eq('id', reservationId)

    if (updateError) throw new Error(`Impossible d'enregistrer le lien de paiement: ${updateError.message}`)

    return json({ url: session.url })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Erreur inconnue' }, 500)
  }
})