import { supabase } from './client'
import { functionErrorMessage } from '../../lib/functionErrors'

export interface CautionLinkResult {
  url?: string
  alreadySecured?: boolean
  released?: boolean
}

export async function getCautionLink(reservationId: string): Promise<CautionLinkResult> {
  const { data, error } = await supabase.functions.invoke('get-caution-link', {
    body: { reservationId },
  })

  if (error) throw new Error(await functionErrorMessage(error))
  if (data?.error) throw new Error(data.error)
  return data as CautionLinkResult
}