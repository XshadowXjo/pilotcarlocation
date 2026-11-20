import { corsHeaders, json, errorResponse, HttpError } from '../_shared/http.ts'
import { estimateDelivery } from '../_shared/delivery.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { address } = await req.json()
    if (!address) throw new HttpError(400, 'Adresse manquante')
    return json(await estimateDelivery(address))
  } catch (err) {
    return errorResponse(err)
  }
})
