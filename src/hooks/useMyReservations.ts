import { useState, useEffect, useCallback } from 'react'
import { getMyReservations, type ReservationRecord } from '../services/supabase/reservations'

export function useMyReservations(userId: string | null) {
  const [reservations, setReservations] = useState<ReservationRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!userId) {
      setReservations([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      setReservations(await getMyReservations(userId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }, [userId])


  useEffect(() => {
    reload()
  }, [userId])

  return { reservations, isLoading, error, reload }
}