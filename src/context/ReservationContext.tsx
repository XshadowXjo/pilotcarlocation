import { createContext, useContext, useState, type ReactNode } from 'react'
import { emptyReservationForm, type ReservationFormState, type FileKey } from '../types/reservation'
import type { UserProfile } from '../services/supabase/profile'

interface ReservationContextValue {
  form: ReservationFormState
  updateField: <K extends keyof Omit<ReservationFormState, 'files'>>(
    field: K,
    value: ReservationFormState[K]
  ) => void
  updateFile: (key: FileKey, file: File | null) => void
  loadFromProfile: (profile: UserProfile) => void
}

const ReservationContext = createContext<ReservationContextValue | null>(null)

export function ReservationProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<ReservationFormState>(emptyReservationForm)

  const updateField: ReservationContextValue['updateField'] = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateFile = (key: FileKey, file: File | null) => {
    setForm((prev) => ({ ...prev, files: { ...prev.files, [key]: file } }))
  }

  const loadFromProfile = (profile: UserProfile) => {
    setForm((prev) => ({
      ...prev,
      firstName: profile.firstName || prev.firstName,
      lastName: profile.lastName || prev.lastName,
      birthDate: profile.birthDate || prev.birthDate,
      phone: profile.phone || prev.phone,
      address: profile.address || prev.address,
      city: profile.city || prev.city,
      postalCode: profile.postalCode || prev.postalCode,
      country: profile.country || prev.country,
      licenseNumber: profile.licenseNumber || prev.licenseNumber,
      existingDocumentPaths: profile.documentPaths,
    }))
  }

  return (
    <ReservationContext.Provider value={{ form, updateField, updateFile, loadFromProfile }}>
      {children}
    </ReservationContext.Provider>
  )
}

export function useReservationForm() {
  const context = useContext(ReservationContext)
  if (!context) {
    throw new Error('useReservationForm doit être utilisé à l\'intérieur d\'un ReservationProvider')
  }
  return context
}