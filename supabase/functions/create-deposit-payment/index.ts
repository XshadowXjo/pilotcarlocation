import { corsHeaders, json, errorResponse, createAdminClient, requireAdmin, HttpError, escapeHtml, formatDate } from '../_shared/http.ts'
import { createDepositCheckout } from '../_shared/stripe.ts'
import { ensureCautionLink, type CautionOutcome } from '../_shared/caution.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? 'onboarding@resend.dev'

const supabaseAdmin = createAdminClient()

// Après confirmation par l'admin : envoie au client le lien d'acompte et, si besoin, de caution
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    await requireAdmin(supabaseAdmin, req)

    const { reservationId } = await req.json()

    const { data: reservation, error } = await supabaseAdmin
      .from('reservations')
      .select('*, vehicles(name)')
      .eq('id', reservationId)
      .single()

    if (error || !reservation) throw new HttpError(404, 'Réservation introuvable')
    if (reservation.status !== 'confirmed') throw new HttpError(400, "La réservation n'est pas confirmée")

    // 1. Acompte (Stripe), s'il n'est pas déjà réglé
    let depositUrl: string | null = null
    if (reservation.payment_status !== 'deposit_paid') {
      depositUrl = await createDepositCheckout(supabaseAdmin, reservation)
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
    return errorResponse(err)
  }
})