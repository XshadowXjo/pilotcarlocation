import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ensureCautionLink } from '../_shared/caution.ts'

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

    const outcome = await ensureCautionLink(supabaseAdmin, reservation)

    if (outcome.state === 'link') return json({ url: outcome.link })
    if (outcome.state === 'secured') return json({ alreadySecured: true })
    if (outcome.state === 'released') return json({ released: true })
    return json({ error: 'Aucune caution en ligne pour cette réservation' }, 400)
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Erreur inconnue' }, 500)
  }
})