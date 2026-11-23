import { useReservationForm } from '@/context/ReservationContext'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PersonalInfoFormProps {
  stepNumber?: number
}

export default function PersonalInfoForm({ stepNumber = 1 }: PersonalInfoFormProps) {
  const { form, updateField } = useReservationForm()

  return (
    <div className="mb-6 rounded-[10px] border border-border bg-card p-7">
      <h2 className="mb-5 flex items-center gap-2.5 text-[15px] font-semibold tracking-[1.5px] text-primary">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{stepNumber}</span>
        Informations personnelles
      </h2>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="res-lastName" className="mb-1.5 block text-xs font-medium text-muted-foreground">Nom <span className="text-primary">*</span></Label>
          <Input
            id="res-lastName"
            autoComplete="family-name"
            type="text"
            placeholder="Ex : Diallo"
            value={form.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="res-firstName" className="mb-1.5 block text-xs font-medium text-muted-foreground">Prénom <span className="text-primary">*</span></Label>
          <Input
            id="res-firstName"
            autoComplete="given-name"
            type="text"
            placeholder="Ex : Alassane"
            value={form.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
          />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="res-birthDate" className="mb-1.5 block text-xs font-medium text-muted-foreground">Date de naissance <span className="text-primary">*</span></Label>
          <Input
            id="res-birthDate"
            autoComplete="bday"
            type="date"
            value={form.birthDate}
            onChange={(e) => updateField('birthDate', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="res-phone" className="mb-1.5 block text-xs font-medium text-muted-foreground">Téléphone <span className="text-primary">*</span></Label>
          <Input
            id="res-phone"
            autoComplete="tel"
            type="tel"
            placeholder="06 00 00 00 00"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
          />
        </div>
      </div>

      <div className="mb-4">
        <Label htmlFor="res-email" className="mb-1.5 block text-xs font-medium text-muted-foreground">Adresse e-mail <span className="text-primary">*</span></Label>
        <Input
          id="res-email"
          autoComplete="email"
          type="email"
          placeholder="vous@exemple.com"
          value={form.email}
          onChange={(e) => updateField('email', e.target.value)}
        />
      </div>

      <div className="mb-4">
        <Label htmlFor="res-address" className="mb-1.5 block text-xs font-medium text-muted-foreground">Adresse postale <span className="text-primary">*</span></Label>
        <Input
          id="res-address"
          autoComplete="street-address"
          type="text"
          placeholder="N°, rue"
          value={form.address}
          onChange={(e) => updateField('address', e.target.value)}
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="res-city" className="mb-1.5 block text-xs font-medium text-muted-foreground">Ville <span className="text-primary">*</span></Label>
          <Input
            id="res-city"
            autoComplete="address-level2"
            type="text"
            placeholder="Ex : Versailles"
            value={form.city}
            onChange={(e) => updateField('city', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="res-postalCode" className="mb-1.5 block text-xs font-medium text-muted-foreground">Code postal <span className="text-primary">*</span></Label>
          <Input
            id="res-postalCode"
            autoComplete="postal-code"
            type="text"
            placeholder="78000"
            value={form.postalCode}
            onChange={(e) => updateField('postalCode', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="res-country" className="mb-1.5 block text-xs font-medium text-muted-foreground">Pays <span className="text-primary">*</span></Label>
          <Input
            id="res-country"
            autoComplete="country-name"
            type="text"
            value={form.country}
            onChange={(e) => updateField('country', e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="res-licenseNumber" className="mb-1.5 block text-xs font-medium text-muted-foreground">Numéro de permis de conduire <span className="text-primary">*</span></Label>
        <Input
          id="res-licenseNumber"
          autoComplete="off"
          type="text"
          placeholder="Numéro figurant sur le permis"
          value={form.licenseNumber}
          onChange={(e) => updateField('licenseNumber', e.target.value)}
        />
      </div>
    </div>
  )
}