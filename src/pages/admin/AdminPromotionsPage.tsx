import { useState } from 'react'
import { useAdminPromotions } from '../../hooks/useAdminPromotions'
import { deletePromotion } from '../../services/supabase/promotions'
import PromotionFormDialog from '../../components/admin/PromotionFormDialog'
import { Button } from '@/components/ui/button'
import type { Promotion } from '@/types/promotion'

function getStatusLabel(promo: Promotion): { label: string; className: string } {
  if (!promo.active) return { label: 'Désactivée', className: 'bg-muted text-muted-foreground' }
  const today = new Date().toISOString().slice(0, 10)
  if (today < promo.startDate) return { label: 'À venir', className: 'bg-yellow-500/20 text-yellow-500' }
  if (today > promo.endDate) return { label: 'Expirée', className: 'bg-muted text-muted-foreground' }
  return { label: 'Active', className: 'bg-primary/20 text-primary' }
}

export default function AdminPromotionsPage() {
  const { promotions, isLoading, error, reload } = useAdminPromotions()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Promotion | null>(null)

  const handleDelete = async (promo: Promotion) => {
    if (!confirm(`Supprimer la promotion "${promo.label}" ?`)) return
    await deletePromotion(promo.id)
    reload()
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold uppercase tracking-wide">Promotions</h1>
        <Button onClick={() => { setEditing(null); setDialogOpen(true) }}>+ Nouvelle promotion</Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Chargement...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!isLoading && promotions.length === 0 && <p className="text-sm text-muted-foreground">Aucune promotion créée.</p>}

      <div className="space-y-3">
        {promotions.map((promo) => {
          const status = getStatusLabel(promo)
          return (
            <div key={promo.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
              <div>
                <p className="font-semibold">
                  {promo.label} —{' '}
                  {promo.discountType === 'percentage' ? `-${promo.discountValue}%` : `-${promo.discountValue}€`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {promo.appliesToAllVehicles ? 'Toute la flotte' : `${promo.vehicleIds.length} véhicule(s)`} ·
                  {' '}Du {new Date(promo.startDate).toLocaleDateString('fr-FR')} au {new Date(promo.endDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${status.className}`}>
                  {status.label}
                </span>
                <Button variant="outline" onClick={() => { setEditing(promo); setDialogOpen(true) }}>Modifier</Button>
                <Button variant="outline" onClick={() => handleDelete(promo)}>Supprimer</Button>
              </div>
            </div>
          )
        })}
      </div>

      <PromotionFormDialog open={dialogOpen} onOpenChange={setDialogOpen} promotion={editing} onSaved={reload} />
    </div>
  )
}