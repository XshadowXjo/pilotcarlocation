import { supabase } from './client'

interface ContactMessageInput {
  name: string
  phone: string
  email: string
  vehicleId: string | null
  duration: string
  message: string
}

export async function sendContactMessage(input: ContactMessageInput): Promise<void> {
  const { error } = await supabase.from('contact_messages').insert({
    name: input.name,
    phone: input.phone,
    email: input.email,
    vehicle_id: input.vehicleId || null,
    duration: input.duration || null,
    message: input.message,
  })

  if (error) {
    throw new Error(`Impossible d'envoyer le message : ${error.message}`)
  }
}