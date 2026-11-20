import { supabase } from './client'
import { functionErrorMessage } from '../../lib/functionErrors'

export interface PaymentLinkResult {
  url?: string
  alreadyPaid?: boolean
}

export async function getPaymentLink(reservationId: string): Promise<PaymentLinkResult> {
  const { data, error } = await supabase.functions.invoke('get-payment-link', {
    body: { reservationId },
  })

  if (error) throw new Error(await functionErrorMessage(error))
  if (data?.error) throw new Error(data.error)
  return data as PaymentLinkResult
}
