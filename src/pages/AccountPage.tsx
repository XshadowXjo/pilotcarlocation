import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useMyReservations } from '../hooks/useMyReservations'
import { useVehicles } from '../hooks/useVehicles'
import AuthModal from '@/components/auth/AuthModal'
import ExtensionDialog from '../components/account/ExtensionDialog'
import { Button } from '@/components/ui/button'
import { STATUS_LABELS, getPaymentBadge } from '@/lib/reservationStatus'
import { getPaymentLink } from '@/services/supabase/payments'
import { getCautionLink } from '@/services/supabase/caution'
import type { ReservationRecord } from '@/services/supabase/reservations'

export default function AccountPage() {
  const { user } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)

  if (!user) {
    return (
      <div className="bg-background text-foreground">
        <div className="mx-auto max-w-xl px-6 py-20 text-center">
          <h1 className="text-2xl font-bold uppercase tracking-wide text-[#17181A]">Mon compte</h1>
          <p className="mt-3 text-sm text-[#4A4C50]">
            Connectez-vous pour retrouver vos réservations.
          </p>
          <Button className="mt-6" onClick={() => setModalOpen(true)}>Se connecter</Button>
        </div>
        <AuthModal open={modalOpen} onOpenChange={setModalOpen} />
      </div>
    )
  }

  return <AccountDashboard />
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getStatusMessage(r: ReservationRecord): string {
  if (r.status === 'pending') return 'Votre demande est en cours de vérification par notre équipe.'
  if (r.status === 'cancelled') return "Votre demande n'a pas pu être acceptée. N'hésitez pas à nous contacter."
  if (r.paymentStatus === 'deposit_paid') return 'Réservation confirmée, acompte reçu. Merci !'
  return "Réservation confirmée. Merci de régler l'acompte pour la finaliser."
}

function getCautionMessage(r: ReservationRecord): string | null {
  if (!r.cautionMethod || !r.cautionAmount || r.status === 'cancelled') return null

  if (r.cautionMethod === 'on_site') {
    return `Caution de ${r.cautionAmount} € à régler sur place, au retrait du véhicule.`
  }
  if (r.status !== 'confirmed') {
    return `Caution de ${r.cautionAmount} € : le lien vous sera envoyé après la confirmation de votre réservation.`
  }
  if (r.cautionStatus === 'accepted') return `Caution de ${r.cautionAmount} € validée.`
  if (r.cautionStatus === 'released') return `Caution de ${r.cautionAmount} € libérée.`
  return `Caution de ${r.cautionAmount} € à valider en ligne avant la location.`
}

function PayDepositButton({ reservationId, onAlreadyPaid }: { reservationId: string; onAlreadyPaid: () => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getPaymentLink(reservationId)
      if (result.alreadyPaid) {
        onAlreadyPaid()
        return
      }
      if (result.url) {
        window.location.href = result.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-3">
      <Button onClick={handleClick} disabled={isLoading}>
        {isLoading ? 'Redirection...' : "Payer l'acompte"}
      </Button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}

function PayCautionButton({ reservationId, onResolved }: { reservationId: string; onResolved: () => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getCautionLink(reservationId)
      if (result.alreadySecured || result.released) {
        onResolved()
        return
      }
      if (result.url) {
        window.location.href = result.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-3">
      <Button variant="outline" onClick={handleClick} disabled={isLoading}>
        {isLoading ? 'Redirection...' : 'Valider la caution'}
      </Button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}

function AccountDashboard() {
  const { user, signOut } = useAuth()
  const { reservations, isLoading, error, reload } = useMyReservations(user!.id)
  const { vehicles } = useVehicles()
  const [extendingReservation, setExtendingReservation] = useState<ReservationRecord | null>(null)

  const vehicleName = (id: string) => vehicles.find((v) => v.id === id)?.name ?? 'Véhicule'

  const today = new Date().toISOString().slice(0, 10)
  const isOngoing = (r: ReservationRecord) =>
    r.status === 'confirmed' && r.startDate <= today && r.endDate >= today

  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-14 md:px-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wide text-[#17181A]">Mon compte</h1>
            <p className="mt-1 text-sm text-[#4A4C50]">{user!.email}</p>
          </div>
          <Button variant="outline" onClick={() => signOut()}>Se déconnecter</Button>
        </div>

        <h2 className="mb-4 text-lg font-semibold text-[#17181A]">Mes réservations</h2>

        {isLoading && <p className="text-sm text-[#4A4C50]">Chargement...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!isLoading && !error && reservations.length === 0 && (
          <p className="text-sm text-[#4A4C50]">Aucune réservation pour le moment.</p>
        )}

        <ul className="space-y-3">
          {reservations.map((r) => {
            const status = STATUS_LABELS[r.status] ?? { label: r.status, className: 'bg-muted text-muted-foreground' }
            const payment = getPaymentBadge(r.paymentStatus)
            const isConfirmed = r.status === 'confirmed'
            const isPaid = r.paymentStatus === 'deposit_paid'
            const cautionMessage = getCautionMessage(r)
            const needsCaution =
              isConfirmed &&
              r.cautionMethod === 'online' &&
              !!r.cautionAmount &&
              !['accepted', 'released'].includes(r.cautionStatus)

            return (
              <li key={r.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{vehicleName(r.vehicleId)}</span>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${status.className}`}>
                      {status.label}
                    </span>
                    {isConfirmed && (
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${payment.className}`}>
                        {payment.label}
                      </span>
                    )}
                  </div>
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  Du {formatDate(r.startDate)} au {formatDate(r.endDate)}
                </p>
                <p className="mt-2 text-sm">{getStatusMessage(r)}</p>

                {r.totalPrice !== null && r.depositDue !== null && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Total : {r.totalPrice} € · Acompte (50 %) : {r.depositDue} €
                  </p>
                )}

                {cautionMessage && <p className="mt-1 text-xs text-muted-foreground">{cautionMessage}</p>}

                <div className="flex flex-wrap gap-x-3">
                  {isConfirmed && !isPaid && r.depositDue !== null && r.depositDue > 0 && (
                    <PayDepositButton reservationId={r.id} onAlreadyPaid={reload} />
                  )}
                  {needsCaution && <PayCautionButton reservationId={r.id} onResolved={reload} />}
                </div>

                {isOngoing(r) && (
                  <Button variant="outline" className="mt-3" onClick={() => setExtendingReservation(r)}>
                    Demander une prolongation
                  </Button>
                )}
              </li>
            )
          })}
        </ul>

        {extendingReservation && (
          <ExtensionDialog
            open={!!extendingReservation}
            onOpenChange={(open) => !open && setExtendingReservation(null)}
            reservation={extendingReservation}
            onRequested={reload}
          />
        )}
      </div>
    </div>
  )
}