const ORS_API_KEY = Deno.env.get('ORS_API_KEY')!
const AGENCY_ADDRESS = Deno.env.get('AGENCY_ADDRESS')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function geocode(address: string): Promise<[number, number]> {
  const url = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(address)}&size=1`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Géocodage échoué (${res.status})`)
  const data = await res.json()
  const coords = data.features?.[0]?.geometry?.coordinates
  if (!coords) throw new Error('Adresse introuvable')
  return coords
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { address } = await req.json()
    if (!address) throw new Error('Adresse manquante')

    const [agencyCoords, clientCoords] = await Promise.all([
      geocode(AGENCY_ADDRESS),
      geocode(address),
    ])

    const routeUrl = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${agencyCoords[0]},${agencyCoords[1]}&end=${clientCoords[0]},${clientCoords[1]}`
    const routeRes = await fetch(routeUrl)
    if (!routeRes.ok) throw new Error(`Calcul d'itinéraire échoué (${routeRes.status})`)
    const routeData = await routeRes.json()
    const distanceMeters = routeData.features?.[0]?.properties?.summary?.distance
    if (distanceMeters === undefined) throw new Error('Distance introuvable')

    const distanceKm = Math.round(distanceMeters / 1000)
    const price = distanceKm * 1

    return new Response(JSON.stringify({ distanceKm, price }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Erreur inconnue' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})