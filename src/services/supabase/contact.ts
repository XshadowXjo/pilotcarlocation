import { supabase } from './client'
import { functionErrorMessage } from '../../lib/functionErrors'

interface ContactMessageInput {
  name: string
  phone: string
  email: string
  vehicleId: string | null
  duration: string
  message: string
  website?: string
}

export interface ContactMessage {
  id: string
  name: string
  phone: string
  email: string
  vehicleName: string | null
  duration: string | null
  message: string
  createdAt: string
}

// Enregistre le message et prévient l'agence par e-mail (fonction serveur)
export async function sendContactMessage(input: ContactMessageInput): Promise<void> {
  const { data, error } = await supabase.functions.invoke('send-contact-message', { body: input })
  if (error) throw new Error(await functionErrorMessage(error))
  if (data?.error) throw new Error(data.error)
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  const { data, error } = await supabase
    .from('contact_messages')
    .select('id, name, phone, email, duration, message, created_at, vehicles(name)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Impossible de récupérer les messages : ${error.message}`)

  return data.map((row: any) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    vehicleName: row.vehicles?.name ?? null,
    duration: row.duration,
    message: row.message,
    createdAt: row.created_at,
  }))
}

export async function deleteContactMessage(id: string): Promise<void> {
  const { error } = await supabase.from('contact_messages').delete().eq('id', id)
  if (error) throw new Error(`Impossible de supprimer le message : ${error.message}`)
}
