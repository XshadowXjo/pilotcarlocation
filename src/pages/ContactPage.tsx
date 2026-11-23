import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useVehicles } from '../hooks/useVehicles'
import { sendContactMessage } from '../services/supabase/contact'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
        website: formData.get('website') as string,
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
          Nous <span className="text-[#4A5E00]">contacter</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-[#4A4C50]">
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
              {/* Champ piège invisible : seuls les robots le remplissent */}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
              <div>
                <Label htmlFor="contact-name" className="mb-1.5 block text-xs font-medium text-muted-foreground">Nom et prénom <span className="text-primary">*</span></Label>
                <Input id="contact-name" required name="name" autoComplete="name" placeholder="Ex : Alassane Diallo" />
              </div>
              <div>
                <Label htmlFor="contact-phone" className="mb-1.5 block text-xs font-medium text-muted-foreground">Téléphone <span className="text-primary">*</span></Label>
                <Input id="contact-phone" required name="phone" type="tel" autoComplete="tel" placeholder="06 12 34 56 78" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="contact-email" className="mb-1.5 block text-xs font-medium text-muted-foreground">E-mail <span className="text-primary">*</span></Label>
                <Input id="contact-email" required name="email" type="email" autoComplete="email" placeholder="vous@exemple.com" />
              </div>

              <div>
                <Label htmlFor="contact-vehicle" className="mb-1.5 block text-xs font-medium text-muted-foreground">Véhicule souhaité</Label>
                <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                  <SelectTrigger id="contact-vehicle" className="w-full">
                    <SelectValue placeholder="Indifférent" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="contact-duration" className="mb-1.5 block text-xs font-medium text-muted-foreground">Durée souhaitée</Label>
                <Input
                  id="contact-duration"
                  name="duration"
                  placeholder="Ex : 3 semaines"
                  defaultValue={longue ? "Plus d'une semaine" : ''}
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="contact-message" className="mb-1.5 block text-xs font-medium text-muted-foreground">Votre message <span className="text-primary">*</span></Label>
                <textarea
                  id="contact-message"
                  required
                  name="message"
                  rows={5}
                  placeholder="Dites-nous ce dont vous avez besoin"
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                />
              </div>

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