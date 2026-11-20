import Stripe from 'npm:stripe@17'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  httpClient: Stripe.createFetchHttpClient(),
})

const SITE_URL = Deno.env.get('SITE_URL')!

// Crée la session de paiement de l'acompte et l'enregistre sur la réservation
export async function createDepositCheckout(supabaseAdmin: SupabaseClient, reservation: any): Promise<string> {
  if (!reservation.deposit_due) throw new Error("Aucun montant d'acompte calculé pour cette réservation")

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
    metadata: { reservation_id: reservation.id },
  })

  const { error } = await supabaseAdmin
    .from('reservations')
    .update({ stripe_session_id: session.id, stripe_payment_link: session.url })
    .eq('id', reservation.id)
  if (error) throw new Error(`Impossible d'enregistrer le lien de paiement: ${error.message}`)

  return session.url!
}
