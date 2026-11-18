import { useState } from 'react'
import { calculateDeliveryPrice } from '@/services/supabase/delivery'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useReservationForm } from '@/context/ReservationContext'
import { useVehicleAvailability } from '../../hooks/useVehicleAvailability'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import type { DateRange } from 'react-day-picker'
import { pickupLocations } from '@/lib/pickupLocations'

function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

interface DateLocationFormProps {
  vehicleId: string
}

export default function DateLocationForm({ vehicleId }: DateLocationFormProps) {
  const { form, updateField } = useReservationForm()
  const { bookedRanges } = useVehicleAvailability(vehicleId)
  const [isCalculating, setIsCalculating] = useState(false)
  const [deliveryError, setDeliveryError] = useState<string | null>(null)

  const handleCalculateDelivery = async () => {
    if (!form.deliveryAddress.trim()) return
    setIsCalculating(true)
    setDeliveryError(null)
    try {
      const { distanceKm, price } = await calculateDeliveryPrice(form.deliveryAddress)
      updateField('deliveryDistanceKm', distanceKm)
      updateField('deliveryPrice', price)
    } catch (err) {
      setDeliveryError(err instanceof Error ? err.message : 'Erreur de calcul')
    } finally {
      setIsCalculating(false)
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const selectedRange: DateRange | undefined = form.startDate
    ? { from: new Date(form.startDate), to: form.endDate ? new Date(form.endDate) : undefined }
    : undefined

  const handleRangeSelect = (range: DateRange | undefined) => {
    updateField('startDate', range?.from ? toISODate(range.from) : '')
    updateField('endDate', range?.to ? toISODate(range.to) : '')
  }

  return (
    <div className="mb-6 rounded-[10px] border border-border bg-card p-7">
      <h2 className="mb-5 flex items-center gap-2.5 text-[15px] font-semibold tracking-[1.5px] text-primary">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
        Dates &amp; lieu de location
      </h2>

      <div className="mb-5">
        <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Lieu de retrait <span className="text-primary">*</span></Label>
        <Select value={form.pickupLocation} onValueChange={(value) => updateField('pickupLocation', value)}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pickupLocations.map((location) => (
              <SelectItem key={location.value} value={location.value}>{location.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {form.pickupLocation === 'livraison' && (
        <div className="mb-5">
          <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Adresse de livraison</Label>
          <div className="flex gap-2">
            <Input
              value={form.deliveryAddress}
              onChange={(e) => { updateField('deliveryAddress', e.target.value); updateField('deliveryPrice', null) }}
              placeholder="N°, rue, ville, code postal"
            />
            <Button type="button" variant="outline" onClick={handleCalculateDelivery} disabled={isCalculating}>
              {isCalculating ? '...' : 'Calculer'}
            </Button>
          </div>
          {deliveryError && <p className="mt-1 text-xs text-destructive">{deliveryError}</p>}
          {form.deliveryPrice !== null && (
            <p className="mt-1 text-xs text-primary">
              {form.deliveryDistanceKm} km — {form.deliveryPrice} € de frais de livraison
            </p>
          )}
        </div>
      )}

      <div>
        <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Dates de location <span className="text-primary">*</span>
        </Label>
        <div className="rounded-lg border border-border bg-background p-3">
          <Calendar
            mode="range"
            selected={selectedRange}
            onSelect={handleRangeSelect}
            disabled={[{ before: today }, ...bookedRanges.map((r) => ({ from: r.start, to: r.end }))]}
            numberOfMonths={2}
            className="mx-auto"
          />
        </div>
        {form.startDate && form.endDate && (
          <p className="mt-2 text-xs text-muted-foreground">
            Du {new Date(form.startDate).toLocaleDateString('fr-FR')} au {new Date(form.endDate).toLocaleDateString('fr-FR')}
          </p>
        )}
      </div>
    </div>
  )
}