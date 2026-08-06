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
    pricePerWeek: row.price_par_week,
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