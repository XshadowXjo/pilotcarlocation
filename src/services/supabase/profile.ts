import { supabase } from './client'
import type { FileKey } from '../../types/reservation'

export interface UserProfile {
  firstName: string
  lastName: string
  birthDate: string
  phone: string
  address: string
  city: string
  postalCode: string
  country: string
  licenseNumber: string
  documentPaths: Partial<Record<FileKey, string>>
}

function mapRowToProfile(row: any): UserProfile {
  return {
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    birthDate: row.birth_date ?? '',
    phone: row.phone ?? '',
    address: row.address ?? '',
    city: row.city ?? '',
    postalCode: row.postal_code ?? '',
    country: row.country ?? 'France',
    licenseNumber: row.license_number ?? '',
    documentPaths: {
      permisRecto: row.permis_recto_path ?? undefined,
      permisVerso: row.permis_verso_path ?? undefined,
      cniRecto: row.cni_recto_path ?? undefined,
      cniVerso: row.cni_verso_path ?? undefined,
      justificatif: row.justificatif_path ?? undefined,
    },
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(`Impossible de récupérer le profil : ${error.message}`)
  return data ? mapRowToProfile(data) : null
}

export async function upsertUserProfile(
  userId: string,
  fields: Omit<UserProfile, 'documentPaths'>,
  documentPaths: Partial<Record<FileKey, string>>
): Promise<void> {
  const { error } = await supabase.from('user_profiles').upsert({
    user_id: userId,
    first_name: fields.firstName,
    last_name: fields.lastName,
    birth_date: fields.birthDate || null,
    phone: fields.phone,
    address: fields.address,
    city: fields.city,
    postal_code: fields.postalCode,
    country: fields.country,
    license_number: fields.licenseNumber,
    permis_recto_path: documentPaths.permisRecto ?? null,
    permis_verso_path: documentPaths.permisVerso ?? null,
    cni_recto_path: documentPaths.cniRecto ?? null,
    cni_verso_path: documentPaths.cniVerso ?? null,
    justificatif_path: documentPaths.justificatif ?? null,
    updated_at: new Date().toISOString(),
  })

  if (error) throw new Error(`Impossible d'enregistrer le profil : ${error.message}`)
}