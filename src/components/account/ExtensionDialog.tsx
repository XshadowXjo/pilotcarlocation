import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { useVehicleAvailability } from '../../hooks/useVehicleAvailability'
import { requestExtension } from '../../services/supabase/extensions'
import type { ReservationRecord } from '@/services/supabase/reservations'

interface ExtensionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reservation: ReservationRecord
  onRequested: () => void
}

export default function ExtensionDialog({ open, onOpenChange, reservation, onRequested }: ExtensionDialogProps) {
  const { bookedRanges } = useVehicleAvailability(reservation.vehicleId)
  const [newEndDate, setNewEndDate] = useState<Date | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const minDate = (() => {
    const d = new Date(reservation.endDate)
    d.setDate(d.getDate() + 1)
    return d
  })()

  const handleConfirm = async () => {
    if (!newEndDate) return
    setIsSubmitting(true)
    setError(null)
    try {
      const y = newEndDate.getFullYear()
      const m = String(newEndDate.getMonth() + 1).padStart(2, '0')
      const d = String(newEndDate.getDate()).padStart(2, '0')
      await requestExtension(reservation.id, `${y}-${m}-${d}`)
      onRequested()
      onOpenChange(false)
      setNewEndDate(undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Demander une prolongation</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Choisissez la nouvelle date de fin de location. Votre demande devra être validée.
        </p>
        <Calendar
          mode="single"
          selected={newEndDate}
          onSelect={setNewEndDate}
          disabled={[{ before: minDate }, ...bookedRanges.map((r) => ({ from: r.start, to: r.end }))]}
          className="mx-auto"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button className="w-full" onClick={handleConfirm} disabled={!newEndDate || isSubmitting}>
          {isSubmitting ? 'Envoi...' : 'Envoyer la demande'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}