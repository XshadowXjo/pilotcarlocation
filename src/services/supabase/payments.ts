import { supabase } from './client'

export interface PaymentLinkResult {
  url?: string
  alreadyPaid?: boolean
}

export async function getPaymentLink(reservationId: string): Promise<PaymentLinkResult> {
  const { data, error } = await supabase.functions.invoke('get-payment-link', {
    body: { reservationId },
  })

  if (error) {
    let message = error.message
    const context = (error as { context?: Response }).context
    if (context && typeof context.json === 'function') {
      try {
        const body = await context.json()
        if (body?.error) message = body.error
      } catch {
        // on garde le message générique
      }
    }
    throw new Error(message)
  }

  if (data?.error) throw new Error(data.error)
  return data as PaymentLinkResult
}