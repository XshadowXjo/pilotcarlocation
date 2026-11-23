import { useCallback, useEffect, useState } from 'react'
import { deleteContactMessage, getContactMessages, type ContactMessage } from '../../services/supabase/contact'
import { Button } from '@/components/ui/button'

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setMessages(await getContactMessages())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  const handleDelete = async (message: ContactMessage) => {
    if (!confirm(`Supprimer le message de ${message.name} ? Cette action est définitive.`)) return
    try {
      await deleteContactMessage(message.id)
      setMessages((list) => list.filter((m) => m.id !== message.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold uppercase tracking-wide">Messages</h1>
      <p className="mb-6 text-xs text-muted-foreground">
        Demandes envoyées depuis la page Contact. Vous recevez aussi chaque message par e-mail.
      </p>

      {isLoading && <p className="text-sm text-muted-foreground">Chargement...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!isLoading && !error && messages.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucun message pour le moment.</p>
      )}

      <div className="space-y-3">
        {messages.map((message) => (
          <article key={message.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{message.name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(message.createdAt).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
                  {message.vehicleName && ` · ${message.vehicleName}`}
                  {message.duration && ` · ${message.duration}`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={`tel:${message.phone}`} className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:border-primary">
                  {message.phone}
                </a>
                <a href={`mailto:${message.email}`} className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:border-primary">
                  Répondre par e-mail
                </a>
                <Button variant="outline" onClick={() => handleDelete(message)}>Supprimer</Button>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm">{message.message}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
