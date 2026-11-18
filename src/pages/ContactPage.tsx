import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useVehicles } from '../hooks/useVehicles'
import { sendContactMessage } from '../services/supabase/contact'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const socialLinks = [
  { label: 'Instagram', href: '#' },
  { label: 'Facebook', href: '#' },
  { label: 'TikTok', href: '#' },
  { label: 'LinkedIn', href: '#' },
]

export default function ContactPage() {
  const [searchParams] = useSearchParams()
  const carFromUrl = searchParams.get('car') ?? ''
  const longue = searchParams.get('longue') === 'true'

  const { vehicles } = useVehicles()
  const [sent, setSent] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState(carFromUrl)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await sendContactMessage({
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        email: formData.get('email') as string,
        vehicleId: selectedVehicle || null,
        duration: formData.get('duration') as string,
        message: formData.get('message') as string,
      })
      setSent(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setIsSubmitting(false)
    }
  }  

  return (
    <div className="bg-background text-foreground">
      <section className="mx-auto max-w-5xl px-6 py-14 md:px-12">
        <h1 className="text-3xl font-bold uppercase text-black tracking-wide sm:text-4xl">
          Nous <span className="text-primary">contacter</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          {longue
            ? "Location de plus d'une semaine : décrivez votre besoin, nous vous envoyons un tarif dégressif sur mesure sous 2 heures ouvrées."
            : 'Une question sur un véhicule, une caution ou une longue durée ? Nous répondons sous 2 heures ouvrées.'}
        </p>

        <div className="mt-10 grid gap-8 md:grid-cols-[minmax(0,1fr)_320px]">
          {sent ? (
            <div className="rounded-xl border border-primary/50 bg-card p-8">
              <h2 className="text-2xl font-bold text-primary">Message envoyé</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Merci ! Un conseiller PCE vous répond très vite.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-6 rounded-md border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="grid gap-3 rounded-xl border border-border bg-card p-6 sm:grid-cols-2"
            >
              <Input required name="name" placeholder="Nom et prénom" />
              <Input required name="phone" type="tel" placeholder="Téléphone" />
              <Input required name="email" type="email" placeholder="E-mail" className="sm:col-span-2" />

              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Véhicule souhaité" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                name="duration"
                placeholder="Durée souhaitée (ex : 3 semaines)"
                defaultValue={longue ? "Plus d'une semaine" : ''}
              />

              <textarea
                required
                name="message"
                rows={5}
                placeholder="Votre message"
                className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary sm:col-span-2"
              />

              {submitError && (
                <p className="text-xs text-destructive sm:col-span-2">{submitError}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-primary px-4 py-3 text-sm font-bold uppercase tracking-widest text-primary-foreground sm:col-span-2"
              >
                {isSubmitting ? 'Envoi en cours...' : 'Envoyer la demande'}
              </button>
            </form>
          )}

          <aside className="space-y-4 text-sm">
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-lg font-bold">Téléphone</h2>
              <a href="tel:0600000000" className="mt-2 block font-semibold text-primary">
                06 00 00 00 00
              </a>
              <a href="mailto:contact@pilotcarelite.fr" className="mt-1 block text-muted-foreground">
                contact@pilotcarelite.fr
              </a>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-lg font-bold">Horaires</h2>
              <p className="mt-2 text-muted-foreground">7j/7 · 8h – 00h</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-lg font-bold">Réseaux sociaux</h2>
              <ul className="mt-2 space-y-1.5">
                {socialLinks.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-muted-foreground transition-colors hover:text-primary">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}