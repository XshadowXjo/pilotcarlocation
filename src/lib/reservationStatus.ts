export const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: 'En attente', className: 'bg-yellow-500/20 text-yellow-500' },
  confirmed: { label: 'Confirmée', className: 'bg-primary/20 text-primary' },
  cancelled: { label: 'Refusée', className: 'bg-destructive/20 text-destructive' },
}

export function getPaymentBadge(paymentStatus: string): { label: string; className: string } {
  return paymentStatus === 'deposit_paid'
    ? { label: 'Acompte payé', className: 'bg-primary/20 text-primary' }
    : { label: 'Acompte en attente', className: 'bg-yellow-500/20 text-yellow-500' }
}