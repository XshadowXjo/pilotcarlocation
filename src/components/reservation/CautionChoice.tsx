import { useReservationForm } from '@/context/ReservationContext'
import type { CautionMethod } from '@/types/reservation'

interface CautionChoiceProps {
  amount: number
  tone?: 'default' | 'onGray'
}

const OPTIONS: { value: CautionMethod; label: string; hint: string }[] = [
  { value: 'online', label: 'Régler la caution en ligne', hint: 'De façon sécurisée, via Swikly.' },
  { value: 'on_site', label: 'Régler la caution sur place', hint: 'Au moment de récupérer le véhicule.' },
]

export default function CautionChoice({ amount, tone = 'default' }: CautionChoiceProps) {
  const { form, updateField } = useReservationForm()
  const onGray = tone === 'onGray'

  return (
    <fieldset className="my-4">
      <legend className={`mb-2 text-xs font-semibold uppercase tracking-wide ${onGray ? 'text-white/70' : 'text-muted-foreground'}`}>
        Caution : {amount} €
      </legend>
      <div className="space-y-2">
        {OPTIONS.map((option) => {
          const selected = form.cautionMethod === option.value
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-2.5 rounded-md border p-3 text-sm transition-colors ${
                selected ? 'border-primary' : onGray ? 'border-white/20' : 'border-border'
              } ${onGray ? 'text-white' : 'text-foreground'}`}
            >
              <input
                type="radio"
                name="caution-method"
                value={option.value}
                checked={selected}
                onChange={() => updateField('cautionMethod', option.value)}
                className="mt-0.5 accent-primary"
              />
              <span>
                <span className="block font-medium">{option.label}</span>
                <span className={`block text-xs ${onGray ? 'text-white/70' : 'text-muted-foreground'}`}>
                  {option.hint}
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}