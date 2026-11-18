import { supabase } from './client'

export interface DateRange {
  start: Date
  end: Date
}

export async function getVehicleBookedRanges(vehicleId: string): Promise<DateRange[]> {
  const { data, error } = await supabase
    .from('vehicle_booked_dates')
    .select('start_date, end_date')
    .eq('vehicle_id', vehicleId)

  if (error) {
    throw new Error(`Impossible de récupérer les disponibilités : ${error.message}`)
  }

  return data.map((row) => ({
    start: new Date(row.start_date),
    end: new Date(row.end_date),
  }))
}