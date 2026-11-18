import { supabase } from './client'
import type { Vehicle } from '../../types/vehicle'

function mapRowToVehicle(row: any): Vehicle {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    imageUrl: row.image_url,
    pricePerDay: row.price_per_day,
    priceThreeDays: row.price_three_days,
    pricePerWeek: row.price_per_week,
    archived: row.archived,
    powerHp: row.power_hp,
    transmission: row.transmission,
    fuelType: row.fuel_type,
    depositAmount: row.deposit_amount,
    featured: row.featured,
    options: row.options ?? [],
  }
}

 export async function getVehicles(): Promise<Vehicle[]> {
   const { data, error } = await supabase
     .from('vehicles')
     .select('*')
     .eq('archived', false)
     .order('created_at', { ascending: true })

   if (error) {
     throw new Error(`Impossible de récupérer les véhicules : ${error.message}`)
   }

  return data.map(mapRowToVehicle)
}

export async function getVehicleById(id: string): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new Error(`Impossible de récupérer le véhicule : ${error.message}`)
  }

  return data ? mapRowToVehicle(data) : null
 }

 function mapFormToRow(fields: VehicleFormInput) {
  return {
    name: fields.name,
    category: fields.category,
    price_per_day: fields.pricePerDay,
    price_three_days: fields.priceThreeDays,
    price_per_week: fields.pricePerWeek,
    power_hp: fields.powerHp,
    transmission: fields.transmission,
    fuel_type: fields.fuelType,
    deposit_amount: fields.depositAmount,
    featured: fields.featured,
    options: fields.options,
    image_url: fields.imageUrl,
  }
}

export interface VehicleFormInput {
  name: string
  category: string
  pricePerDay: number
  priceThreeDays: number | null
  pricePerWeek: number | null
  powerHp: number | null
  transmission: string | null
  fuelType: string | null
  depositAmount: number | null
  featured: boolean
  options: string[]
  imageUrl: string | null
}

export async function getAllVehiclesForAdmin(): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Impossible de récupérer les véhicules : ${error.message}`)
  return data.map(mapRowToVehicle)
}

export async function createVehicle(fields: VehicleFormInput): Promise<void> {
  const { error } = await supabase.from('vehicles').insert(mapFormToRow(fields))
  if (error) throw new Error(`Impossible de créer le véhicule : ${error.message}`)
}

export async function updateVehicle(id: string, fields: VehicleFormInput): Promise<void> {
  const { error } = await supabase.from('vehicles').update(mapFormToRow(fields)).eq('id', id)
  if (error) throw new Error(`Impossible de modifier le véhicule : ${error.message}`)
}

export async function archiveVehicle(id: string): Promise<void> {
  const { error } = await supabase.from('vehicles').update({ archived: true }).eq('id', id)
  if (error) throw new Error(`Impossible d'archiver le véhicule : ${error.message}`)
}

export async function uploadVehicleImage(file: File): Promise<string> {
  const extension = file.name.split('.').pop()
  const path = `${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage.from('vehicle-images').upload(path, file)
  if (error) throw new Error(`Échec de l'envoi de l'image : ${error.message}`)

  const { data } = supabase.storage.from('vehicle-images').getPublicUrl(path)
  return data.publicUrl
}