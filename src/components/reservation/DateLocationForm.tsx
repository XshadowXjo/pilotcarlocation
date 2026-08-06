import { useReservationForm } from '@/context/ReservationContext'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const pickupLocations = [
  { value: 'Mantes Station', label: 'Gare de Mantes-Station (78)' },
  { value: 'livraison', label: 'Livraison' },
]

export default function DateLocationForm() {
    const { form, updateField } = useReservationForm()

    return (
    <div className="mb-6 rounded-[10px] border border-border bg-card p-7">
      <h2 className="mb-5 flex items-center gap-2.5 text-[15px] font-semibold tracking-[1.5px] text-primary">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
        Dates &amp; lieu de location
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Lieu de retrait <span className="text-primary">*</span></Label>
          <Select value={form.pickupLocation} onValueChange={(value) => updateField('pickupLocation', value)}>            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pickupLocations.map((location) => (
                <SelectItem key={location.value} value={location.value}>{location.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Date de départ <span className="text-primary">*</span></Label>
          <Input type="date" value={form.startDate} onChange={(e) => updateField('startDate', e.target.value)} />        </div>
        <div>
          <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Date de retour <span className="text-primary">*</span></Label>
          <Input type="date" value={form.endDate} onChange={(e) => updateField('endDate', e.target.value)} />        </div>
      </div>
    </div>
  )
}