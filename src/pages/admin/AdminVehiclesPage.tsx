import { useState } from 'react'
import { useAdminVehicles } from '../../hooks/useAdminVehicles'
import { archiveVehicle } from '../../services/supabase/vehicles'
import VehicleFormDialog from '../../components/admin/VehicleFormDialog'
import { Button } from '@/components/ui/button'
import type { Vehicle } from '@/types/vehicle'

export default function AdminVehiclesPage() {
  const { vehicles, isLoading, error, reload } = useAdminVehicles()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)

  const openCreate = () => {
    setEditingVehicle(null)
    setDialogOpen(true)
  }

  const openEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setDialogOpen(true)
  }

  const handleArchive = async (vehicle: Vehicle) => {
    if (!confirm(`Archiver "${vehicle.name}" ? Il disparaîtra du catalogue public.`)) return
    await archiveVehicle(vehicle.id)
    reload()
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold uppercase tracking-wide">Véhicules</h1>
        <Button onClick={openCreate}>+ Ajouter un véhicule</Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Chargement...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <ul className="space-y-3">
        {vehicles.map((vehicle) => (
          <li key={vehicle.id} className={`flex items-center justify-between rounded-lg border border-border bg-card p-4 ${vehicle.archived ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-3">
              {vehicle.imageUrl && (
                <img src={vehicle.imageUrl} alt="" className="h-12 w-16 rounded object-cover" />
              )}
              <div>
                <p className="font-semibold">
                  {vehicle.name} {vehicle.archived && <span className="text-xs text-muted-foreground">(archivé)</span>}
                </p>
                <p className="text-xs text-muted-foreground">{vehicle.category} · {vehicle.pricePerDay} €/24h</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => openEdit(vehicle)}>Modifier</Button>
              {!vehicle.archived && (
                <Button variant="outline" onClick={() => handleArchive(vehicle)}>Archiver</Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <VehicleFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        vehicle={editingVehicle}
        onSaved={reload}
      />
    </div>
  )
}