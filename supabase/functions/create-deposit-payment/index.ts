import Stripe from 'npm:stripe@17'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ensureCautionLink, type CautionOutcome } from '../_shared/caution.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  httpClient: Stripe.createFetchHttpClient(),
})
const SITE_URL = Deno.env.get('SITE_URL')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? 'onboarding@resend.dev'

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

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Accès réservé aux administrateurs
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !userData.user) return json({ error: 'Connexion requise' }, 401)

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', userData.user.id)
      .maybeSingle()
    if (!profile?.is_admin) return json({ error: 'Accès réservé aux administrateurs' }, 403)

    const { reservationId } = await req.json()

    const { data: reservation, error } = await supabaseAdmin
      .from('reservations')
      .select('*, vehicles(name)')
      .eq('id', reservationId)
      .single()

    if (error || !reservation) throw new Error(`Réservation introuvable: ${error?.message}`)
    if (reservation.status !== 'confirmed') throw new Error("La réservation n'est pas confirmée")

    // 1. Acompte (Stripe), s'il n'est pas déjà réglé
    let depositUrl: string | null = null
    if (reservation.payment_status !== 'deposit_paid') {
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
        metadata: { reservation_id: reservationId },
      })

      const { error: updateError } = await supabaseAdmin
        .from('reservations')
        .update({ stripe_session_id: session.id, stripe_payment_link: session.url })
        .eq('id', reservationId)
      if (updateError) throw new Error(`Impossible d'enregistrer le lien de paiement: ${updateError.message}`)

      depositUrl = session.url
    }

    // 2. Caution en ligne (Swikly) : un échec ici n'empêche pas l'envoi de l'acompte
    let caution: CautionOutcome = { state: 'not_required' }
    let cautionError: string | null = null
    try {
      caution = await ensureCautionLink(supabaseAdmin, reservation)
    } catch (err) {
      cautionError = err instanceof Error ? err.message : 'Erreur inconnue'
      console.error('Caution non créée :', cautionError)
    }
    const cautionUrl = caution.state === 'link' ? caution.link : null

    if (!depositUrl && !cautionUrl) {
      if (cautionError) throw new Error(`Caution : ${cautionError}`)
      throw new Error('Rien à envoyer : acompte déjà réglé et aucune caution en ligne en attente')
    }

    // 3. Un seul email au client
    const onSiteNote =
      reservation.caution_method === 'on_site' && reservation.caution_amount
        ? `<p>La caution de <strong>${escapeHtml(reservation.caution_amount)} €</strong> sera à régler sur place, lors de la remise du véhicule.</p>`
        : ''

    const subject =
      depositUrl && cautionUrl
        ? 'Votre réservation est confirmée — acompte et caution à régler'
        : depositUrl
          ? 'Votre réservation est confirmée — acompte à régler'
          : 'Votre réservation est confirmée — caution à valider'

    const html = `
      <h2>Réservation confirmée — ${escapeHtml(reservation.vehicles?.name)}</h2>
      <p>Bonjour ${escapeHtml(reservation.first_name)},</p>
      <p>Votre réservation du ${formatDate(reservation.start_date)} au ${formatDate(reservation.end_date)} est confirmée.</p>
      ${
        depositUrl
          ? `<p>Merci de régler l'acompte de <strong>${escapeHtml(reservation.deposit_due)} €</strong> (50 % du total) :</p>
             <p><a href="${depositUrl}">Payer l'acompte en ligne</a></p>`
          : ''
      }
      ${
        cautionUrl
          ? `<p>La caution de <strong>${escapeHtml(reservation.caution_amount)} €</strong> est à valider en ligne avant la location :</p>
             <p><a href="${cautionUrl}">Valider la caution</a></p>`
          : ''
      }
      ${onSiteNote}
    `

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: EMAIL_FROM, to: reservation.email, subject, html }),
    })

    if (!resendResponse.ok) {
      throw new Error(`Resend a refusé l'envoi: ${await resendResponse.text()}`)
    }

    return json({ success: true, depositSent: !!depositUrl, cautionSent: !!cautionUrl, cautionError })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Erreur inconnue' }, 500)
  }
})