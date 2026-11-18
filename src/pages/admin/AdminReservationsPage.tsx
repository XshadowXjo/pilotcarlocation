import { useAdminReservations } from '../../hooks/useAdminReservations'
import ReservationCard from '../../components/admin/ReservationCard'

export default function AdminReservationsPage() {
  const { reservations, isLoading, error, reload } = useAdminReservations()

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold uppercase tracking-wide">Réservations</h1>

      {isLoading && <p className="text-sm text-muted-foreground">Chargement...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!isLoading && !error && reservations.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucune réservation pour le moment.</p>
      )}

      <div className="space-y-3">
        {reservations.map((reservation) => (
          <ReservationCard key={reservation.id} reservation={reservation} onStatusChanged={reload} />
        ))}
      </div>
    </div>
  )
}