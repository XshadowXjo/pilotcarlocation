import { useState, useEffect, useCallback } from 'react'
import { getAllVehiclesForAdmin } from '../services/supabase/vehicles'
import type { Vehicle } from '../types/vehicle'

export function useAdminVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getAllVehiclesForAdmin()
      setVehicles(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { vehicles, isLoading, error, reload }
}