import { useState, useEffect } from 'react'
import { getVehicles } from '../services/supabase/vehicles'
import type { Vehicle } from '../types/vehicle'

interface UseVehiclesResult {
  vehicles: Vehicle[]
  isLoading: boolean
  error: string | null
}

export function useVehicles(): UseVehiclesResult {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function loadVehicles() {
      setIsLoading(true)
      setError(null)

      try {
        const data = await getVehicles()
        if (!isCancelled) {
          setVehicles(data)
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Erreur inconnue')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadVehicles()

    return () => {
      isCancelled = true
    }
  }, [])

  return { vehicles, isLoading, error }
}