import { useState, useEffect } from 'react'
import { getVehicleById } from '../services/supabase/vehicles'
import type { Vehicle } from '../types/vehicle'

interface UseVehicleResult {
  vehicle: Vehicle | null
  isLoading: boolean
  error: string | null
}

export function useVehicle(id: string | undefined): UseVehicleResult {
const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setIsLoading(false)
      setError('Identifiant du véhicule manquant.')
      return
    }

    let isCancelled = false

    async function loadVehicle() {
      setIsLoading(true)
      setError(null)

      try {
        const data = await getVehicleById(id as string)
        if (!isCancelled) {
          setVehicle(data)
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

    loadVehicle()

    return () => {
      isCancelled = true
    }
  }, [id])
    return { vehicle, isLoading, error }
}