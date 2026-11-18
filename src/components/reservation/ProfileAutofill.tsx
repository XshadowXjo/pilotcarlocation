import { useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useReservationForm } from '@/context/ReservationContext'
import { useUserProfile } from '../../hooks/useUserProfile'

export default function ProfileAutofill() {
  const { user } = useAuth()
  const { profile } = useUserProfile(user?.id ?? null)
  const { form, loadFromProfile, updateField } = useReservationForm()
  const hasAppliedProfile = useRef(false)

  useEffect(() => {
    if (!profile || hasAppliedProfile.current) return
    loadFromProfile(profile)
    hasAppliedProfile.current = true
  }, [profile])

  useEffect(() => {
    if (user?.email && !form.email) {
      updateField('email', user.email)
    }
  }, [user])

  return null
}