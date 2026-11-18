import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyWebhookSignature } from '../_shared/swikly.ts'

const webhookSecret = Deno.env.get('SWIKLY_WEBHOOK_SECRET')!

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  const signature = req.headers.get('Swikly-Signature')
  if (!signature) return new Response('Signature manquante', { status: 400 })

  const body = await req.text()

  if (!(await verifyWebhookSignature(body, signature, webhookSecret))) {
    console.error('Signature Swikly invalide')
    return new Response('Signature invalide', { status: 400 })
  }

  let payload: any
  try {
    payload = JSON.parse(body)
  } catch {
    return new Response('Corps invalide', { status: 400 })
  }

  if (payload.event === 'requestSecured') {
    const swiklyId: string | undefined = payload.request?.id
    const customId: string | undefined = payload.request?.customId

    let updatedRows = 0

    if (swiklyId) {
      const { data, error } = await supabaseAdmin
        .from('reservations')
        .update({ caution_status: 'accepted' })
        .eq('swikly_id', swiklyId)
        .select('id')
      if (error) {
        console.error('Mise à jour de la caution échouée :', error.message)
        return new Response(`Erreur base de données: ${error.message}`, { status: 500 })
      }
      updatedRows = data?.length ?? 0
    }

    if (updatedRows === 0 && customId) {
      const { error } = await supabaseAdmin
        .from('reservations')
        .update({ caution_status: 'accepted', swikly_id: swiklyId ?? null })
        .eq('id', customId)
      if (error) {
        console.error('Mise à jour de la caution échouée :', error.message)
        return new Response(`Erreur base de données: ${error.message}`, { status: 500 })
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})