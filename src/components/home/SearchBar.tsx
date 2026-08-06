import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function SearchBar() {
  const [departure, setDeparture] = useState('')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')

  return (
    <div className="mb-4 px-6 md:px-[90px]">
      <div className="rounded-xl bg-[#767776] px-6 py-3 shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] md:px-9">
        <p className="mb-5 text-center text-lg font-extrabold uppercase tracking-[0.16em] text-[#B8F000] md:text-xl">
          Réservez votre véhicule
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
          <div>
            <Label htmlFor="departure" className="mb-1.5 block text-[13px] font-extrabold tracking-wider text-white">
              Lieu de départ
            </Label>
            <Input
              id="departure"
              type="text"
              placeholder="Choisissez un lieu"
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="dateStart" className="mb-1.5 block text-[13px] font-extrabold tracking-wider text-white">
              Date de départ
            </Label>
            <Input
              id="dateStart"
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="dateEnd" className="mb-1.5 block text-[13px] font-extrabold tracking-wider text-white">
              Date de retour
            </Label>
            <Input
              id="dateEnd"
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
            />
          </div>

          <Button className="whitespace-nowrap md:px-7">
            Rechercher 🔍
          </Button>
        </div>
      </div>
    </div>
  )
}