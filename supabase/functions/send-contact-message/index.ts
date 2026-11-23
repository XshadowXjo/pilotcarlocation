import { corsHeaders, json, errorResponse, createAdminClient, HttpError, escapeHtml } from '../_shared/http.ts'

// Formulaire de contact : enregistre le message et prévient l'agence par e-mail.
// Le client peut répondre directement depuis sa messagerie (en-tête « Répondre à »).

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const NOTIFICATION_EMAIL = Deno.env.get('NOTIFICATION_EMAIL')!
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? 'onboarding@resend.dev'
const SITE_URL = Deno.env.get('SITE_URL') ?? ''

const supabaseAdmin = createAdminClient()

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_LENGTH = { name: 120, phone: 40, email: 200, duration: 60, message: 4000 }

function readText(value: unknown, label: string, max: number, required = true): string | null {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) {
    if (required) throw new HttpError(400, `Champ manquant : ${label}`)
    return null
  }
  if (text.length > max) throw new HttpError(400, `${label} : ${max} caractères maximum`)
  return text
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    // Champ invisible du formulaire : rempli uniquement par les robots
    if (body.website) return json({ success: true })

    const name = readText(body.name, 'nom', MAX_LENGTH.name)!
    const phone = readText(body.phone, 'téléphone', MAX_LENGTH.phone)!
    const email = readText(body.email, 'e-mail', MAX_LENGTH.email)!
    if (!EMAIL.test(email)) throw new HttpError(400, 'Adresse e-mail invalide')
    const duration = readText(body.duration, 'durée', MAX_LENGTH.duration, false)
    const message = readText(body.message, 'message', MAX_LENGTH.message)!

    let vehicleName: string | null = null
    let vehicleId: string | null = null
    if (typeof body.vehicleId === 'string' && body.vehicleId) {
      const { data: vehicle } = await supabaseAdmin.from('vehicles').select('id, name').eq('id', body.vehicleId).maybeSingle()
      vehicleId = vehicle?.id ?? null
      vehicleName = vehicle?.name ?? null
    }

    const { error } = await supabaseAdmin
      .from('contact_messages')
      .insert({ name, phone, email, vehicle_id: vehicleId, duration, message })
    if (error) throw new Error(`Impossible d'enregistrer le message : ${error.message}`)

    // L'e-mail est un plus : s'il échoue, le message reste visible dans l'admin
    try {
      const html = `
        <h2>Nouveau message de contact</h2>
        <p><strong>De :</strong> ${escapeHtml(name)}</p>
        <p><strong>Téléphone :</strong> ${escapeHtml(phone)}</p>
        <p><strong>E-mail :</strong> ${escapeHtml(email)}</p>
        ${vehicleName ? `<p><strong>Véhicule :</strong> ${escapeHtml(vehicleName)}</p>` : ''}
        ${duration ? `<p><strong>Durée souhaitée :</strong> ${escapeHtml(duration)}</p>` : ''}
        <hr />
        <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
        ${SITE_URL ? `<p style="font-size:12px;color:#888;">Tous les messages : <a href="${SITE_URL}/admin/messages">espace admin</a></p>` : ''}
      `
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: NOTIFICATION_EMAIL,
          reply_to: email,
          subject: `Contact — ${name}${vehicleName ? ` (${vehicleName})` : ''}`,
          html,
        }),
      })
      if (!response.ok) console.error('E-mail de contact refusé :', await response.text())
    } catch (err) {
      console.error("Échec de l'e-mail de contact :", err)
    }

    return json({ success: true })
  } catch (err) {
    return errorResponse(err)
  }
})
