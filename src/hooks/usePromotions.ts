// src/hooks/usePromotions.ts
import { useState, useEffect } from 'react'
import { getActivePromotions } from '../services/supabase/promotions'
import type { Promotion } from '../types/promotion'

export function usePromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isCancelled = false
    getActivePromotions()
      .then((data) => { if (!isCancelled) setPromotions(data) })
      .catch(() => { if (!isCancelled) setPromotions([]) })
      .finally(() => { if (!isCancelled) setIsLoading(false) })
    return () => { isCancelled = true }
  }, [])

  return { promotions, isLoading }
}