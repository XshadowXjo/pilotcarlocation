import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const NOTIFICATION_EMAIL = Deno.env.get('NOTIFICATION_EMAIL')!
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? 'onboarding@resend.dev'
const SITE_URL = Deno.env.get('SITE_URL') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const DOCUMENT_LABELS: Record<string, string> = {
  permis_recto_path: 'Permis (recto)',
  permis_verso_path: 'Permis (verso)',
  cni_recto_path: 'CNI (recto)',
  cni_verso_path: 'CNI (verso)',
  justificatif_path: 'Justificatif de domicile',
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

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

async function getSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.storage
    .from('reservation-documents')
    .createSignedUrl(path, 60 * 60 * 24)

  if (error) {
    console.error(`Lien impossible pour ${path} : ${error.message}`)
    return null
  }
  return data.signedUrl
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
  })

  if (!response.ok) {
    throw new Error(`Resend a refusé l'envoi vers ${to} : ${await response.text()}`)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { reservationId } = await req.json()

    const { data: reservation, error: resError } = await supabaseAdmin
      .from('reservations')
      .select('*, vehicles(name, category)')
      .eq('id', reservationId)
      .single()

    if (resError || !reservation) {
      throw new Error(`Réservation introuvable : ${resError?.message}`)
    }

    const vehicleName = escapeHtml(reservation.vehicles?.name ?? 'Véhicule')
    const isExtension = !!reservation.parent_reservation_id

    const errors: string[] = []
    let adminEmailSent = false
    let clientEmailSent = false

    // ── 1. Notification admin ───────────────────────────────────────
    try {
      const documentLinks: { label: string; url: string | null }[] = []
      for (const [column, label] of Object.entries(DOCUMENT_LABELS)) {
        const path = reservation[column] as string | null
        if (path) {
          documentLinks.push({ label, url: await getSignedUrl(path) })
        }
      }

      const documentsHtml =
        documentLinks.length === 0
          ? '<li>Aucun document joint</li>'
          : documentLinks
              .map((d) => (d.url ? `<li><a href="${d.url}">${d.label}</a></li>` : `<li>${d.label} — fichier introuvable</li>`))
              .join('')

      const adminHtml = `
        <h2>${isExtension ? 'Demande de prolongation' : 'Nouvelle réservation'} — ${vehicleName}</h2>
        <p><strong>Client :</strong> ${escapeHtml(reservation.first_name)} ${escapeHtml(reservation.last_name)}</p>
        <p><strong>Téléphone :</strong> ${escapeHtml(reservation.phone)}</p>
        <p><strong>E-mail :</strong> ${escapeHtml(reservation.email)}</p>
        <p><strong>Adresse :</strong> ${escapeHtml(reservation.address)}, ${escapeHtml(reservation.postal_code)} ${escapeHtml(reservation.city)}, ${escapeHtml(reservation.country)}</p>
        <p><strong>Permis n° :</strong> ${escapeHtml(reservation.license_number)}</p>
        <hr />
        <p><strong>Lieu de retrait :</strong> ${escapeHtml(reservation.pickup_location)}</p>
        ${reservation.delivery_address ? `<p><strong>Livraison :</strong> ${escapeHtml(reservation.delivery_address)} (${escapeHtml(reservation.delivery_price)} €)</p>` : ''}
        <p><strong>Dates :</strong> du ${formatDate(reservation.start_date)} au ${formatDate(reservation.end_date)}</p>
        ${reservation.total_price ? `<p><strong>Total :</strong> ${escapeHtml(reservation.total_price)} € — acompte : ${escapeHtml(reservation.deposit_due)} €</p>` : ''}
        <hr />
        <p><strong>Documents :</strong></p>
        <ul>${documentsHtml}</ul>
        <p style="font-size:12px;color:#888;">Ces liens expirent dans 24 heures.</p>
      `

      await sendEmail(
        NOTIFICATION_EMAIL,
        `${isExtension ? 'Prolongation' : 'Nouvelle réservation'} — ${reservation.vehicles?.name ?? ''}`,
        adminHtml
      )
      adminEmailSent = true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      errors.push(`admin : ${message}`)
      console.error('Email admin non envoyé :', message)
    }

    // Courte pause : on évite de saturer le débit autorisé par Resend
    await wait(600)

    // ── 2. Accusé de réception client ───────────────────────────────
    try {
      const accountHtml =
        reservation.user_id && SITE_URL
          ? `<p>Suivez l'état de votre réservation dans votre <a href="${SITE_URL}/compte">espace client</a>.</p>`
          : ''

      const clientHtml = `
        <h2>${isExtension ? 'Demande de prolongation reçue' : 'Demande de réservation reçue'}</h2>
        <p>Bonjour ${escapeHtml(reservation.first_name)},</p>
        <p>Nous avons bien reçu votre demande pour <strong>${vehicleName}</strong>, du ${formatDate(reservation.start_date)} au ${formatDate(reservation.end_date)}.</p>
        <p>Elle est <strong>en attente de validation</strong> : nous vérifions votre dossier et revenons vers vous rapidement.</p>
        ${
          reservation.total_price
            ? `<p>Total estimé : <strong>${escapeHtml(reservation.total_price)} €</strong>. Un acompte de ${escapeHtml(reservation.deposit_due)} € (50 %) vous sera demandé une fois votre réservation validée.</p>`
            : ''
        }
        <p>Aucun paiement n'est demandé à ce stade.</p>
        ${accountHtml}
      `

      await sendEmail(
        reservation.email,
        isExtension ? 'Demande de prolongation reçue' : 'Demande de réservation reçue — en attente de validation',
        clientHtml
      )
      clientEmailSent = true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      errors.push(`client : ${message}`)
      console.error('Accusé de réception non envoyé :', message)
    }

    if (!adminEmailSent && !clientEmailSent) {
      throw new Error(errors.join(' | '))
    }

    return new Response(JSON.stringify({ success: true, adminEmailSent, clientEmailSent, errors }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Erreur inconnue' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})