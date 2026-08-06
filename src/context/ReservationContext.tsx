import { createContext, useContext, useState, type ReactNode } from 'react'
import { emptyReservationForm, type ReservationFormState, type FileKey } from '../types/reservation'

interface ReservationContextValue {
  form: ReservationFormState
  updateField: <K extends keyof Omit<ReservationFormState, 'files'>>(
    field: K,
    value: ReservationFormState[K]
  ) => void
  updateFile: (key: FileKey, file: File | null) => void
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

  return (
    <ReservationContext.Provider value={{ form, updateField, updateFile }}>
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