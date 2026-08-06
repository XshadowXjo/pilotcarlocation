export type FileKey = 'permisRecto' | 'permisVerso' | 'cniRecto' | 'cniVerso' | 'justificatif'

export interface ReservationFormState {
  firstName: string
  lastName: string
  birthDate: string
  phone: string
  email: string
  address: string
  city: string
  postalCode: string
  country: string
  licenseNumber: string
  pickupLocation: string
  startDate: string
  endDate: string
  files: Record<FileKey, File | null>
  cguAccepted: boolean
}

export const emptyReservationForm: ReservationFormState = {
  firstName: '',
  lastName: '',
  birthDate: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  postalCode: '',
  country: 'France',
  licenseNumber: '',
  pickupLocation: 'versailles',
  startDate: '',
  endDate: '',
  files: {
    permisRecto: null,
    permisVerso: null,
    cniRecto: null,
    cniVerso: null,
    justificatif: null,
  },
  cguAccepted: false,
}