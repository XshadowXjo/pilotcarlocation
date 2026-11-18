export type FileKey = 'permisRecto' | 'permisVerso' | 'cniRecto' | 'cniVerso' | 'justificatif'

export type CautionMethod = 'online' | 'on_site'

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
  deliveryAddress: string
  deliveryPrice: number | null
  deliveryDistanceKm: number | null
  cautionMethod: CautionMethod
  files: Record<FileKey, File | null>
  existingDocumentPaths: Partial<Record<FileKey, string>>
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
  pickupLocation: 'mantes-station',
  startDate: '',
  endDate: '',
  deliveryAddress: '',
  deliveryPrice: null,
  deliveryDistanceKm: null,
  cautionMethod: 'online',
  files: {
    permisRecto: null,
    permisVerso: null,
    cniRecto: null,
    cniVerso: null,
    justificatif: null,
  },
  existingDocumentPaths: {},
  cguAccepted: false,
}