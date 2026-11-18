const API_URL = Deno.env.get('SWIKLY_API_URL') ?? 'https://api.sandbox.swikly.com/v1'
const API_KEY = Deno.env.get('SWIKLY_API_KEY')!
const ACCOUNT_ID = Deno.env.get('SWIKLY_ACCOUNT_ID')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!

export interface SwiklyRequest {
  id: string
  link: string
  deposit?: { status: string } | null
}

async function swiklyFetch(path: string, init: RequestInit = {}): Promise<any> {
  const response = await fetch(`${API_URL}/accounts/${ACCOUNT_ID}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'PilotCarElite/1',
    },
  })

  const text = await response.text()
  let body: any = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = null
  }

  if (!response.ok) {
    const details = body?.errors ? ` (${JSON.stringify(body.errors)})` : ''
    throw new Error(`Swikly ${response.status} : ${body?.message ?? 'erreur inconnue'}${details}`)
  }

  return body
}

// Swikly exige un numéro avec indicatif : on ne convertit que les numéros français évidents
export function toInternationalPhone(phone: string, country: string): string | null {
  const cleaned = (phone ?? '').replace(/[\s.\-()]/g, '')
  if (cleaned.startsWith('+')) return cleaned
  if (cleaned.startsWith('00')) return `+${cleaned.slice(2)}`
  if (cleaned.startsWith('0') && country.trim().toLowerCase() === 'france') return `+33${cleaned.slice(1)}`
  return null
}

interface DepositRequestInput {
  reservationId: string
  vehicleName: string
  firstName: string
  lastName: string
  email: string
  phone: string
  country: string
  birthDate: string | null
  startDate: string
  endDate: string
  amountEuros: number
}

export async function createDepositRequest(input: DepositRequestInput): Promise<SwiklyRequest> {
  const body: Record<string, unknown> = {
    description: `Caution — ${input.vehicleName} (${input.startDate} au ${input.endDate})`,
    language: 'fr',
    customId: input.reservationId,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    sendEmail: false,
    sendSms: false,
    callbacks: { requestSecured: `${SUPABASE_URL}/functions/v1/swikly-webhook` },
    deposit: {
      startDate: input.startDate,
      endDate: input.endDate,
      amount: Math.round(input.amountEuros * 100),
    },
  }

  if (input.birthDate) body.birthDate = input.birthDate
  const phone = toInternationalPhone(input.phone, input.country)
  if (phone) body.phoneNumber = phone

  const result = await swiklyFetch('/requests', { method: 'POST', body: JSON.stringify(body) })
  return result.request as SwiklyRequest
}

export async function getRequest(requestId: string): Promise<SwiklyRequest> {
  const result = await swiklyFetch(`/requests/${requestId}?with=deposit`)
  return result.request as SwiklyRequest
}

export async function releaseRequest(requestId: string): Promise<void> {
  await swiklyFetch(`/requests/${requestId}/release`, { method: 'POST' })
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// Vérification décrite dans la documentation : HMAC-SHA256 de "<timestamp>.<corps brut>"
export async function verifyWebhookSignature(
  rawBody: string,
  header: string,
  secret: string,
  toleranceSeconds = 600
): Promise<boolean> {
  const parts: Record<string, string> = {}
  for (const part of header.split(',')) {
    const index = part.indexOf('=')
    if (index > 0) parts[part.slice(0, index).trim()] = part.slice(index + 1).trim()
  }

  const timestamp = parts['t']
  const signature = parts['sha256']
  if (!timestamp || !signature) return false

  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (!Number.isFinite(age) || age > toleranceSeconds) return false

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${rawBody}`))
  const expected = Array.from(new Uint8Array(mac))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

  return timingSafeEqual(expected, signature)
}
