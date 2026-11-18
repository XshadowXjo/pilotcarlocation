export type DiscountType = 'percentage' | 'fixed'

export interface Promotion {
  id: string
  label: string
  discountType: DiscountType
  discountValue: number
  appliesToAllVehicles: boolean
  startDate: string
  endDate: string
  active: boolean
  vehicleIds: string[]
}