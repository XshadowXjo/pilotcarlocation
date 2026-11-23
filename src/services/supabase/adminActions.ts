import { supabase } from './client'
import { functionErrorMessage } from '../../lib/functionErrors'

export interface SendLinksResult {
  depositSent: boolean
  cautionSent: boolean
  cautionError: string | null
}

export async function sendConfirmationLinks(reservationId: string): Promise<SendLinksResult> {
  const { data, error } = await supabase.functions.invoke('create-deposit-payment', {
    body: { reservationId },
  })

  if (error) throw new Error(await functionErrorMessage(error))
  if (data?.error) throw new Error(data.error)
  return data as SendLinksResult
}

export async function releaseCaution(reservationId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('release-caution', {
    body: { reservationId },
  })

  if (error) throw new Error(await functionErrorMessage(error))
  if (data?.error) throw new Error(data.error)
}
export interface PurgeResult {
  dryRun: boolean
  retentionDays: number
  expiredFiles: number
  orphanFiles: number
  total: number
}

// Pièces d'identité dont on n'a plus besoin (dryRun : compte sans supprimer)
export async function purgeDocuments(dryRun: boolean): Promise<PurgeResult> {
  const { data, error } = await supabase.functions.invoke('purge-documents', { body: { dryRun } })
  if (error) throw new Error(await functionErrorMessage(error))
  if (data?.error) throw new Error(data.error)
  return data as PurgeResult
}
