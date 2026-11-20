import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  corsHeaders,
  json,
  errorResponse,
  createAdminClient,
  getOptionalUser,
  requireUser,
  HttpError,
} from '../_shared/http.ts'
import {
  computeReservationTotal,
  computeDeposit,
  countRentalDays,
  getBestPromotion,
  requiresQuote,
  MAX_ONLINE_DAYS,
  type PricedVehicle,
  type PricingPromotion,
} from '../_shared/pricing.ts'
import { estimateDelivery } from '../_shared/delivery.ts'
import { sendReservationEmails } from '../_shared/reservationEmails.ts'

// Seul point d'entrée pour créer une réservation ou une prolongation.
// Le prix, l'acompte, la caution et les statuts sont calculés ici : rien de ce que le
// navigateur envoie à ce sujet n'est pris en compte.

const supabaseAdmin = createAdminClient()

const DELIVERY_LOCATION = 'livraison'
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
// Chemins produits par uploadDocument() côté site : "<vehicleId>/<timestamp>-<clé>.<ext>"
const DOCUMENT_PATH = /^[A-Za-z0-9-]+\/\d+-[A-Za-z]+\.[A-Za-z0-9]+$/
const DOCUMENT_COLUMNS = {
  permisRecto: 'permis_recto_path',
  permisVerso: 'permis_verso_path',
  cniRecto: 'cni_recto_path',
  cniVerso: 'cni_verso_path',
  justificatif: 'justificatif_path',
} as const

type DocumentKey = keyof typeof DOCUMENT_COLUMNS

interface VehicleRow extends PricedVehicle {
  id: string
  depositAmount: number | null
}

function todayInParis(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' })
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function requireText(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new HttpError(400, `Champ manquant : ${label}`)
  return value.trim()
}

function requireDate(value: unknown, label: string): string {
  if (typeof value !== 'string' || !ISO_DATE.test(value) || Number.isNaN(Date.parse(value))) {
    throw new HttpError(400, `Date invalide : ${label}`)
  }
  return value
}

async function getVehicle(vehicleId: string): Promise<VehicleRow> {
  const { data, error } = await supabaseAdmin
    .from('vehicles')
    .select('id, price_per_day, price_three_days, price_per_week, deposit_amount, archived')
    .eq('id', vehicleId)
    .maybeSingle()
  if (error) throw new Error(`Lecture du véhicule impossible : ${error.message}`)
  if (!data || data.archived) throw new HttpError(404, "Ce véhicule n'est plus disponible")
  return {
    id: data.id,
    pricePerDay: Number(data.price_per_day),
    priceThreeDays: data.price_three_days === null ? null : Number(data.price_three_days),
    pricePerWeek: data.price_per_week === null ? null : Number(data.price_per_week),
    depositAmount: data.deposit_amount === null ? null : Number(data.deposit_amount),
  }
}

async function getActivePromotions(): Promise<PricingPromotion[]> {
  const today = todayInParis()
  const { data: rows, error } = await supabaseAdmin
    .from('promotions')
    .select('id, discount_type, discount_value, applies_to_all_vehicles')
    .eq('active', true)
    .lte('start_date', today)
    .gte('end_date', today)
  if (error) throw new Error(`Lecture des promotions impossible : ${error.message}`)
  if (!rows?.length) return []

  const { data: links, error: linksError } = await supabaseAdmin
    .from('promotion_vehicles')
    .select('promotion_id, vehicle_id')
    .in('promotion_id', rows.map((r) => r.id))
  if (linksError) throw new Error(`Lecture des promotions impossible : ${linksError.message}`)

  return rows.map((row) => ({
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    appliesToAllVehicles: row.applies_to_all_vehicles,
    vehicleIds: (links ?? []).filter((l) => l.promotion_id === row.id).map((l) => l.vehicle_id),
  }))
}

async function priceFor(vehicle: VehicleRow, days: number, deliveryPrice: number | null) {
  if (requiresQuote(days)) {
    throw new HttpError(400, `Au-delà de ${MAX_ONLINE_DAYS} jours, la location se fait sur devis. Merci de nous contacter.`)
  }
  const promo = getBestPromotion(vehicle.id, vehicle.pricePerDay, await getActivePromotions())
  const totalPrice = computeReservationTotal(vehicle, days, promo, deliveryPrice)
  return { totalPrice, depositDue: computeDeposit(totalPrice) }
}

// Bornes incluses, comme dans le calendrier du site. Les réservations refusées ne bloquent rien.
async function assertAvailable(vehicleId: string, start: string, end: string, ignoreId?: string): Promise<void> {
  let query = supabaseAdmin
    .from('reservations')
    .select('id')
    .eq('vehicle_id', vehicleId)
    .neq('status', 'cancelled')
    .lte('start_date', end)
    .gte('end_date', start)
  if (ignoreId) query = query.neq('id', ignoreId)

  const { data, error } = await query.limit(1)
  if (error) throw new Error(`Vérification des disponibilités impossible : ${error.message}`)
  if (data && data.length > 0) {
    throw new HttpError(409, "Le véhicule n'est pas disponible sur ces dates. Merci d'en choisir d'autres.")
  }
}

function readDocumentPaths(input: unknown): Record<string, string | null> {
  const paths = (input ?? {}) as Partial<Record<DocumentKey, unknown>>
  const columns: Record<string, string | null> = {}
  for (const [key, column] of Object.entries(DOCUMENT_COLUMNS) as [DocumentKey, string][]) {
    const value = paths[key]
    if (value === undefined || value === null || value === '') {
      columns[column] = null
    } else if (typeof value === 'string' && DOCUMENT_PATH.test(value)) {
      columns[column] = value
    } else {
      throw new HttpError(400, 'Chemin de document invalide')
    }
  }
  return columns
}

async function insertReservation(row: Record<string, unknown>): Promise<string> {
  const id = crypto.randomUUID()
  const { error } = await supabaseAdmin.from('reservations').insert({ id, ...row })
  if (error) throw new Error(`Impossible d'enregistrer la réservation : ${error.message}`)
  return id
}

async function notify(client: SupabaseClient, reservationId: string): Promise<void> {
  try {
    const result = await sendReservationEmails(client, reservationId)
    if (result.errors.length) console.error('E-mails partiellement envoyés :', result.errors)
  } catch (err) {
    console.error("Échec de l'envoi des e-mails :", err)
  }
}

async function createReservation(req: Request, body: any): Promise<string> {
  const user = await getOptionalUser(supabaseAdmin, req)
  const form = body.form ?? {}

  if (form.cguAccepted !== true) throw new HttpError(400, 'Les conditions générales doivent être acceptées')

  const vehicle = await getVehicle(requireText(body.vehicleId, 'véhicule'))
  const startDate = requireDate(form.startDate, 'début')
  const endDate = requireDate(form.endDate, 'fin')
  if (startDate < todayInParis()) throw new HttpError(400, 'La date de début est déjà passée')
  if (endDate < startDate) throw new HttpError(400, 'La date de fin doit suivre la date de début')

  const pickupLocation = requireText(form.pickupLocation, 'lieu de retrait')
  let deliveryAddress: string | null = null
  let deliveryPrice: number | null = null
  if (pickupLocation === DELIVERY_LOCATION) {
    deliveryAddress = requireText(form.deliveryAddress, 'adresse de livraison')
    deliveryPrice = (await estimateDelivery(deliveryAddress)).price
  }

  await assertAvailable(vehicle.id, startDate, endDate)
  const { totalPrice, depositDue } = await priceFor(vehicle, countRentalDays(startDate, endDate), deliveryPrice)

  const cautionMethod = form.cautionMethod === 'on_site' ? 'on_site' : 'online'

  return insertReservation({
    vehicle_id: vehicle.id,
    user_id: user?.id ?? null,
    first_name: requireText(form.firstName, 'prénom'),
    last_name: requireText(form.lastName, 'nom'),
    birth_date: form.birthDate ? requireDate(form.birthDate, 'date de naissance') : null,
    phone: requireText(form.phone, 'téléphone'),
    email: requireText(form.email, 'e-mail'),
    address: requireText(form.address, 'adresse'),
    city: requireText(form.city, 'ville'),
    postal_code: requireText(form.postalCode, 'code postal'),
    country: requireText(form.country, 'pays'),
    license_number: requireText(form.licenseNumber, 'numéro de permis'),
    pickup_location: pickupLocation,
    start_date: startDate,
    end_date: endDate,
    delivery_address: deliveryAddress,
    delivery_price: deliveryPrice,
    total_price: totalPrice,
    deposit_due: depositDue,
    caution_amount: vehicle.depositAmount,
    caution_method: vehicle.depositAmount ? cautionMethod : null,
    ...readDocumentPaths(body.documentPaths),
    cgu_accepted: true,
    status: 'pending',
  })
}

async function createExtension(req: Request, body: any): Promise<string> {
  const user = await requireUser(supabaseAdmin, req)
  const newEndDate = requireDate(body.newEndDate, 'nouvelle date de fin')

  const { data: original, error } = await supabaseAdmin
    .from('reservations')
    .select('*')
    .eq('id', requireText(body.parentReservationId, 'réservation'))
    .maybeSingle()
  if (error) throw new Error(`Lecture de la réservation impossible : ${error.message}`)
  if (!original || original.user_id !== user.id) throw new HttpError(404, 'Réservation introuvable')
  if (original.status === 'cancelled') throw new HttpError(400, 'Cette réservation a été refusée')
  if (newEndDate <= original.end_date) {
    throw new HttpError(400, 'La nouvelle date de fin doit être après la fin actuelle')
  }

  const vehicle = await getVehicle(original.vehicle_id)
  const startDate = addDays(original.end_date, 1)
  await assertAvailable(vehicle.id, startDate, newEndDate, original.id)
  // Jours facturés comptés comme pour une réservation : écart entre l'ancienne et la nouvelle fin
  const { totalPrice, depositDue } = await priceFor(vehicle, countRentalDays(original.end_date, newEndDate), null)

  return insertReservation({
    vehicle_id: original.vehicle_id,
    user_id: original.user_id,
    first_name: original.first_name,
    last_name: original.last_name,
    birth_date: original.birth_date,
    phone: original.phone,
    email: original.email,
    address: original.address,
    city: original.city,
    postal_code: original.postal_code,
    country: original.country,
    license_number: original.license_number,
    pickup_location: original.pickup_location,
    start_date: startDate,
    end_date: newEndDate,
    total_price: totalPrice,
    deposit_due: depositDue,
    permis_recto_path: original.permis_recto_path,
    permis_verso_path: original.permis_verso_path,
    cni_recto_path: original.cni_recto_path,
    cni_verso_path: original.cni_verso_path,
    justificatif_path: original.justificatif_path,
    cgu_accepted: true,
    status: 'pending',
    parent_reservation_id: original.id,
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const reservationId = body.parentReservationId
      ? await createExtension(req, body)
      : await createReservation(req, body)

    await notify(supabaseAdmin, reservationId)
    return json({ reservationId })
  } catch (err) {
    return errorResponse(err)
  }
})
