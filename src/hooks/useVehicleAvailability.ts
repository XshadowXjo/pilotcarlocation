import { useState, useEffect } from 'react'
import { getVehicleBookedRanges, type DateRange } from '../services/supabase/availability'

export function useVehicleAvailability(vehicleId: string | null) {
  const [bookedRanges, setBookedRanges] = useState<DateRange[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!vehicleId) {
      setBookedRanges([])
      setIsLoading(false)
      return
    }

    let isCancelled = false
    setIsLoading(true)

    getVehicleBookedRanges(vehicleId)
      .then((data) => { if (!isCancelled) setBookedRanges(data) })
      .catch(() => { if (!isCancelled) setBookedRanges([]) })
      .finally(() => { if (!isCancelled) setIsLoading(false) })

    return () => { isCancelled = true }
  }, [vehicleId])

  return { bookedRanges, isLoading }
}