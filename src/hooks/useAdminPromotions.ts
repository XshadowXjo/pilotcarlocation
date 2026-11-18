// src/hooks/useAdminPromotions.ts
import { useState, useEffect, useCallback } from 'react'
import { getAllPromotionsForAdmin } from '../services/supabase/promotions'
import type { Promotion } from '../types/promotion'

export function useAdminPromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setPromotions(await getAllPromotionsForAdmin())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  return { promotions, isLoading, error, reload }
}