import { useNavigate } from 'react-router-dom'
import { useVehicles } from '../../hooks/useVehicles'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface VehicleSelectorProps {
  currentVehicleId: string
}

export default function VehicleSelector({ currentVehicleId }: VehicleSelectorProps) {
  const navigate = useNavigate()
  const { vehicles, isLoading } = useVehicles()

  if (isLoading || vehicles.length <= 1) return null

  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        Véhicule sélectionné
      </label>
      <Select value={currentVehicleId} onValueChange={(id) => navigate(`/reservation/${id}`)}>
        <SelectTrigger className="w-full sm:w-72">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {vehicles.map((v) => (
            <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}