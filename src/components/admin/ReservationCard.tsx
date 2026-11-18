import { useState } from 'react'
import {
  updateReservationStatus,
  getSignedDocumentUrl,
  DOCUMENT_LABELS,
  type AdminReservation,
} from '@/services/supabase/adminReservations'
import { sendConfirmationLinks, releaseCaution } from '@/services/supabase/adminActions'
import { STATUS_LABELS } from '@/lib/reservationStatus'
import { Button } from '@/components/ui/button'
import type { FileKey } from '@/types/reservation'

interface ReservationCardProps {
  reservation: AdminReservation
  onStatusChanged: () => void
}

function getCautionBadge(r: AdminReservation): { label: string; className: string } | null {
  if (!r.cautionMethod) return null
  const amount = r.cautionAmount !== null ? ` · ${r.cautionAmount} €` : ''

  if (r.cautionMethod === 'on_site') {
    return { label: `Caution sur place${amount}`, className: 'bg-muted text-muted-foreground' }
  }
  switch (r.cautionStatus) {
    case 'accepted':
      return { label: `Caution validée${amount}`, className: 'bg-primary/20 text-primary' }
    case 'released':
      return { label: `Caution libérée${amount}`, className: 'bg-muted text-muted-foreground' }
    case 'requested':
      return { label: `Caution en attente${amount}`, className: 'bg-yellow-500/20 text-yellow-500' }
    default:
      return { label: `Caution en ligne à envoyer${amount}`, className: 'bg-yellow-500/20 text-yellow-500' }
  }
}

export default function ReservationCard({ reservation, onStatusChanged }: ReservationCardProps) {
  const [isDocsOpen, setIsDocsOpen] = useState(false)
  const [documentUrls, setDocumentUrls] = useState<Partial<Record<FileKey, string>>>({})
  const [isLoadingDocs, setIsLoadingDocs] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const statusInfo = STATUS_LABELS[reservation.status] ?? { label: reservation.status, className: 'bg-muted text-muted-foreground' }
  const cautionBadge = getCautionBadge(reservation)
  const documentKeys = Object.keys(reservation.documentPaths) as FileKey[]
  const availableDocs = documentKeys.filter((key) => reservation.documentPaths[key])

  const isPaid = reservation.paymentStatus === 'deposit_paid'
  const cautionOnlinePending =
    reservation.cautionMethod === 'online' && !['accepted', 'released'].includes(reservation.cautionStatus)
  const canResendLinks = reservation.status === 'confirmed' && (!isPaid || cautionOnlinePending)
  const canReleaseCaution = reservation.cautionMethod === 'online' && reservation.cautionStatus === 'accepted'

  const toggleDocs = async () => {
    if (!isDocsOpen && Object.keys(documentUrls).length === 0) {
      setIsLoadingDocs(true)
      const urls: Partial<Record<FileKey, string>> = {}
      for (const key of availableDocs) {
        const path = reservation.documentPaths[key]!
        urls[key] = await getSignedDocumentUrl(path)
      }
      setDocumentUrls(urls)
      setIsLoadingDocs(false)
    }
    setIsDocsOpen((open) => !open)
  }

  const sendLinks = async () => {
    try {
      const result = await sendConfirmationLinks(reservation.id)
      const sent: string[] = []
      if (result.depositSent) sent.push("lien d'acompte")
      if (result.cautionSent) sent.push('lien de caution')
      const warning = result.cautionError ? ` — Caution non créée : ${result.cautionError}` : ''
      setActionMessage(`Envoyé au client : ${sent.join(' et ')} ✓${warning}`)
    } catch (err) {
      setActionMessage(`Échec de l'envoi : ${err instanceof Error ? err.message : 'erreur inconnue'}`)
    }
  }

  const handleStatusChange = async (status: 'confirmed' | 'cancelled') => {
    setIsUpdating(true)
    setActionMessage(null)
    try {
      await updateReservationStatus(reservation.id, status)
      if (status === 'confirmed') {
        await sendLinks()
      }
      onStatusChanged()
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleResend = async () => {
    setIsUpdating(true)
    setActionMessage(null)
    await sendLinks()
    onStatusChanged()
    setIsUpdating(false)
  }

  const handleRelease = async () => {
    if (!confirm('Libérer la caution ? Le client ne pourra plus être prélevé.')) return
    setIsUpdating(true)
    setActionMessage(null)
    try {
      await releaseCaution(reservation.id)
      setActionMessage('Caution libérée ✓')
      onStatusChanged()
    } catch (err) {
      setActionMessage(`Échec de la libération : ${err instanceof Error ? err.message : 'erreur inconnue'}`)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">
            {reservation.firstName} {reservation.lastName} · {reservation.vehicleName}
            {reservation.isExtension && <span className="ml-2 text-xs text-primary">(Prolongation)</span>}
          </p>
          <p className="text-sm text-muted-foreground">
            Du {new Date(reservation.startDate).toLocaleDateString('fr-FR')} au {new Date(reservation.endDate).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
          {reservation.status === 'confirmed' && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                isPaid ? 'bg-primary/20 text-primary' : 'bg-yellow-500/20 text-yellow-500'
              }`}
            >
              {isPaid ? 'Acompte payé' : 'Acompte en attente'}
            </span>
          )}
          {cautionBadge && (
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${cautionBadge.className}`}>
              {cautionBadge.label}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {availableDocs.length > 0 && (
          <Button variant="outline" onClick={toggleDocs} disabled={isLoadingDocs}>
            {isLoadingDocs ? 'Chargement...' : isDocsOpen ? 'Masquer les documents ▴' : 'Voir les documents ▾'}
          </Button>
        )}
        <a href={`mailto:${reservation.email}`}>
          <Button variant="outline">Contacter</Button>
        </a>

        {reservation.status === 'pending' && (
          <>
            <Button onClick={() => handleStatusChange('confirmed')} disabled={isUpdating}>
              ✓ Confirmer
            </Button>
            <Button variant="outline" onClick={() => handleStatusChange('cancelled')} disabled={isUpdating}>
              ✕ Refuser
            </Button>
          </>
        )}

        {canResendLinks && (
          <Button variant="outline" onClick={handleResend} disabled={isUpdating}>
            Renvoyer les liens de paiement
          </Button>
        )}

        {canReleaseCaution && (
          <Button variant="outline" onClick={handleRelease} disabled={isUpdating}>
            Libérer la caution
          </Button>
        )}
      </div>

      {actionMessage && <p className="mt-3 text-xs text-muted-foreground">{actionMessage}</p>}

      {isDocsOpen && (
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-3">
          {availableDocs.map((key) => {
            const url = documentUrls[key]
            const isImage = /\.(jpe?g|png|webp)$/i.test(reservation.documentPaths[key] ?? '')
            return (
              <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="block">
                <div className="flex h-20 items-center justify-center overflow-hidden rounded border border-border bg-background">
                  {isImage && url ? (
                    <img src={url} alt={DOCUMENT_LABELS[key]} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl">📄</span>
                  )}
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">{DOCUMENT_LABELS[key]}</p>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}