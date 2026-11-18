import { useState, useEffect, useCallback } from 'react'
import { getAllReservationsForAdmin, type AdminReservation } from '../services/supabase/adminReservations'

export function useAdminReservations() {
  const [reservations, setReservations] = useState<AdminReservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setReservations(await getAllReservationsForAdmin())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  return { reservations, isLoading, error, reload }
}