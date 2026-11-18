import { supabase } from './client'

export interface DeliveryEstimate {
  distanceKm: number
  price: number
}

export async function calculateDeliveryPrice(address: string): Promise<DeliveryEstimate> {
  const { data, error } = await supabase.functions.invoke('calculate-delivery-price', {
    body: { address },
  })
  if (error) throw new Error(`Impossible de calculer le prix de livraison : ${error.message}`)
  if (data?.error) throw new Error(data.error)
  return data
}