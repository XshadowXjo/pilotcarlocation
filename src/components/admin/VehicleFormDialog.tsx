import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createVehicle, updateVehicle, uploadVehicleImage, type VehicleFormInput } from '@/services/supabase/vehicles'
import type { Vehicle } from '@/types/vehicle'

interface VehicleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle: Vehicle | null // null = création
  onSaved: () => void
}

const emptyForm: VehicleFormInput = {
  name: '',
  category: '',
  pricePerDay: 0,
  priceThreeDays: null,
  pricePerWeek: null,
  powerHp: null,
  transmission: '',
  fuelType: '',
  depositAmount: null,
  featured: false,
  options: [],
  imageUrl: null,
}

export default function VehicleFormDialog({ open, onOpenChange, vehicle, onSaved }: VehicleFormDialogProps) {
  const [form, setForm] = useState<VehicleFormInput>(emptyForm)
  const [optionsText, setOptionsText] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (vehicle) {
      setForm({
        name: vehicle.name,
        category: vehicle.category,
        pricePerDay: vehicle.pricePerDay,
        priceThreeDays: vehicle.priceThreeDays,
        pricePerWeek: vehicle.pricePerWeek,
        powerHp: vehicle.powerHp,
        transmission: vehicle.transmission ?? '',
        fuelType: vehicle.fuelType ?? '',
        depositAmount: vehicle.depositAmount,
        featured: vehicle.featured,
        options: vehicle.options,
        imageUrl: vehicle.imageUrl,
      })
      setOptionsText(vehicle.options.join(', '))
    } else {
      setForm(emptyForm)
      setOptionsText('')
    }
    setImageFile(null)
    setError(null)
  }, [vehicle, open])

  const handleSubmit = async () => {
    setIsSaving(true)
    setError(null)

    try {
      let imageUrl = form.imageUrl
      if (imageFile) {
        imageUrl = await uploadVehicleImage(imageFile)
      }

      const payload: VehicleFormInput = {
        ...form,
        imageUrl,
        options: optionsText.split(',').map((o) => o.trim()).filter(Boolean),
      }

      if (vehicle) {
        await updateVehicle(vehicle.id, payload)
      } else {
        await createVehicle(payload)
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
          <DialogTitle>{vehicle ? 'Modifier le véhicule' : 'Ajouter un véhicule'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Nom</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Catégorie</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Photo</Label>
            <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
            {form.imageUrl && !imageFile && (
              <img src={form.imageUrl} alt="" className="mt-2 h-24 w-36 rounded object-cover" />
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Prix / 24h</Label>
              <Input type="number" value={form.pricePerDay} onChange={(e) => setForm({ ...form, pricePerDay: Number(e.target.value) })} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Prix / 3j</Label>
              <Input type="number" value={form.priceThreeDays ?? ''} onChange={(e) => setForm({ ...form, priceThreeDays: e.target.value ? Number(e.target.value) : null })} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Prix / semaine</Label>
              <Input type="number" value={form.pricePerWeek ?? ''} onChange={(e) => setForm({ ...form, pricePerWeek: e.target.value ? Number(e.target.value) : null })} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Puissance (ch)</Label>
              <Input type="number" value={form.powerHp ?? ''} onChange={(e) => setForm({ ...form, powerHp: e.target.value ? Number(e.target.value) : null })} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Boîte</Label>
              <Input value={form.transmission ?? ''} onChange={(e) => setForm({ ...form, transmission: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Carburant</Label>
              <Input value={form.fuelType ?? ''} onChange={(e) => setForm({ ...form, fuelType: e.target.value })} />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Caution (€)</Label>
            <Input type="number" value={form.depositAmount ?? ''} onChange={(e) => setForm({ ...form, depositAmount: e.target.value ? Number(e.target.value) : null })} />
          </div>

          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Options (séparées par des virgules)</Label>
            <Input value={optionsText} onChange={(e) => setOptionsText(e.target.value)} placeholder="Toit ouvrant, Ciel étoilé..." />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="accent-primary" />
            Mettre en avant sur le catalogue
          </label>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button className="w-full" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Enregistrement...' : vehicle ? 'Enregistrer les modifications' : 'Créer le véhicule'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}