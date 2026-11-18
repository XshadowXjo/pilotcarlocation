import { useState, useEffect } from 'react'
import { getUserProfile, type UserProfile } from '../services/supabase/profile'

export function useUserProfile(userId: string | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      setIsLoading(false)
      return
    }

    let isCancelled = false
    setIsLoading(true)

    getUserProfile(userId)
      .then((data) => { if (!isCancelled) setProfile(data) })
      .catch((err) => {
        console.error('Erreur lors du chargement du profil :', err)
        if (!isCancelled) setProfile(null)
      })      .finally(() => { if (!isCancelled) setIsLoading(false) })

    return () => { isCancelled = true }
  }, [userId])

  return { profile, isLoading }
}