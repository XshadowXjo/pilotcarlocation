import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAdminVehicles } from '../../hooks/useAdminVehicles'
import { createPromotion, updatePromotion, type PromotionFormInput } from '@/services/supabase/promotions'
import type { Promotion } from '@/types/promotion'

interface PromotionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  promotion: Promotion | null
  onSaved: () => void
}

const emptyForm: PromotionFormInput = {
  label: '',
  discountType: 'percentage',
  discountValue: 10,
  appliesToAllVehicles: true,
  startDate: '',
  endDate: '',
  active: true,
  vehicleIds: [],
}

export default function PromotionFormDialog({ open, onOpenChange, promotion, onSaved }: PromotionFormDialogProps) {
  const { vehicles } = useAdminVehicles()
  const [form, setForm] = useState<PromotionFormInput>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (promotion) {
      setForm({
        label: promotion.label,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        appliesToAllVehicles: promotion.appliesToAllVehicles,
        startDate: promotion.startDate,
        endDate: promotion.endDate,
        active: promotion.active,
        vehicleIds: promotion.vehicleIds,
      })
    } else {
      setForm(emptyForm)
    }
    setError(null)
  }, [promotion, open])

  const toggleVehicle = (id: string) => {
    setForm((prev) => ({
      ...prev,
      vehicleIds: prev.vehicleIds.includes(id)
        ? prev.vehicleIds.filter((v) => v !== id)
        : [...prev.vehicleIds, id],
    }))
  }

  const handleSubmit = async () => {
    setIsSaving(true)
    setError(null)
    try {
      if (promotion) {
        await updatePromotion(promotion.id, form)
      } else {
        await createPromotion(form)
      }
      onSaved()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{promotion ? 'Modifier la promotion' : 'Nouvelle promotion'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Nom de la promotion</Label>
            <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Ex : Promo rentrée" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Type de réduction</Label>
              <Select value={form.discountType} onValueChange={(v) => setForm({ ...form, discountType: v as 'percentage' | 'fixed' })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                  <SelectItem value="fixed">Montant fixe (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Valeur</Label>
              <Input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Date de début</Label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Date de fin</Label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-primary" />
            Promotion active (désactive-la ici pour la suspendre sans changer les dates)
          </label>

          <div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.appliesToAllVehicles}
                onChange={(e) => setForm({ ...form, appliesToAllVehicles: e.target.checked })}
                className="accent-primary"
              />
              Toute la flotte
            </label>

            {!form.appliesToAllVehicles && (
              <div className="mt-3 space-y-2 rounded-lg border border-border p-3">
                {vehicles.map((v) => (
                  <label key={v.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.vehicleIds.includes(v.id)}
                      onChange={() => toggleVehicle(v.id)}
                      className="accent-primary"
                    />
                    {v.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button className="w-full" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Enregistrement...' : promotion ? 'Enregistrer' : 'Créer la promotion'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}