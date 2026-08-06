export interface Vehicle {
  id: string
  name: string
  category: string
  imageUrl: string | null
  pricePerDay: number
  priceThreeDays: number
  pricePerWeek: number
  powerHp: number | null
  transmission: string | null
  fuelType: string | null
  depositAmount: number | null
  featured: boolean
  options: string[]
}