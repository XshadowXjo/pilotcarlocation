import { supabase } from './client'
import type { Promotion, DiscountType } from '../../types/promotion'

function mapRow(row: any, vehicleIds: string[]): Promotion {
  return {
    id: row.id,
    label: row.label,
    discountType: row.discount_type,
    discountValue: row.discount_value,
    appliesToAllVehicles: row.applies_to_all_vehicles,
    startDate: row.start_date,
    endDate: row.end_date,
    active: row.active,
    vehicleIds,
  }
}

async function attachVehicleIds(rows: any[]): Promise<Promotion[]> {
  if (rows.length === 0) return []

  const { data: links, error } = await supabase
    .from('promotion_vehicles')
    .select('promotion_id, vehicle_id')
    .in('promotion_id', rows.map((r) => r.id))

  if (error) throw new Error(`Impossible de récupérer les véhicules liés : ${error.message}`)

  return rows.map((row) =>
    mapRow(row, (links ?? []).filter((l) => l.promotion_id === row.id).map((l) => l.vehicle_id))
  )
}

export async function getActivePromotions(): Promise<Promotion[]> {
  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('active', true)
    .lte('start_date', today)
    .gte('end_date', today)

  if (error) throw new Error(`Impossible de récupérer les promotions : ${error.message}`)
  return attachVehicleIds(data)
}

export async function getAllPromotionsForAdmin(): Promise<Promotion[]> {
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Impossible de récupérer les promotions : ${error.message}`)
  return attachVehicleIds(data)
}

export interface PromotionFormInput {
  label: string
  discountType: DiscountType
  discountValue: number
  appliesToAllVehicles: boolean
  startDate: string
  endDate: string
  active: boolean
  vehicleIds: string[]
}

async function linkVehicles(promotionId: string, vehicleIds: string[]): Promise<void> {
  if (vehicleIds.length === 0) return
  const rows = vehicleIds.map((vehicleId) => ({ promotion_id: promotionId, vehicle_id: vehicleId }))
  const { error } = await supabase.from('promotion_vehicles').insert(rows)
  if (error) throw new Error(`Impossible de lier les véhicules : ${error.message}`)
}

export async function createPromotion(fields: PromotionFormInput): Promise<void> {
  const { data, error } = await supabase
    .from('promotions')
    .insert({
      label: fields.label,
      discount_type: fields.discountType,
      discount_value: fields.discountValue,
      applies_to_all_vehicles: fields.appliesToAllVehicles,
      start_date: fields.startDate,
      end_date: fields.endDate,
      active: fields.active,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Impossible de créer la promotion : ${error.message}`)

  if (!fields.appliesToAllVehicles) {
    await linkVehicles(data.id, fields.vehicleIds)
  }
}

export async function updatePromotion(id: string, fields: PromotionFormInput): Promise<void> {
  const { error } = await supabase
    .from('promotions')
    .update({
      label: fields.label,
      discount_type: fields.discountType,
      discount_value: fields.discountValue,
      applies_to_all_vehicles: fields.appliesToAllVehicles,
      start_date: fields.startDate,
      end_date: fields.endDate,
      active: fields.active,
    })
    .eq('id', id)

  if (error) throw new Error(`Impossible de modifier la promotion : ${error.message}`)

  // On repart d'une liste de liens propre à chaque sauvegarde plutôt que de calculer un diff
  await supabase.from('promotion_vehicles').delete().eq('promotion_id', id)
  if (!fields.appliesToAllVehicles) {
    await linkVehicles(id, fields.vehicleIds)
  }
}

export async function deletePromotion(id: string): Promise<void> {
  const { error } = await supabase.from('promotions').delete().eq('id', id)
  if (error) throw new Error(`Impossible de supprimer la promotion : ${error.message}`)
}