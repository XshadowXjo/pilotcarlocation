import { useParams } from 'react-router-dom'
import { useVehicle } from '../hooks/useVehicle'
import { useVehicles } from '../hooks/useVehicles'
import { ReservationProvider } from '../context/ReservationContext'
import ProfileAutofill from '../components/reservation/ProfileAutofill'
import PersonalInfoForm from '../components/reservation/PersonalInfoForm'
import DateLocationForm from '../components/reservation/DateLocationForm'
import DocumentsUpload from '../components/reservation/DocumentsUpload'
import VehicleSummary from '../components/reservation/VehicleSummary'
import VehicleSelector from '../components/reservation/VehicleSelector'

export default function ReservationPage() {
  const { vehicleId } = useParams<{ vehicleId?: string }>()

  const { vehicle: vehicleFromUrl, isLoading: isLoadingOne, error: errorOne } = useVehicle(vehicleId)
  const { vehicles: allVehicles, isLoading: isLoadingAll, error: errorAll } = useVehicles()

  const vehicle = vehicleId ? vehicleFromUrl : allVehicles[0] ?? null
  const isLoading = vehicleId ? isLoadingOne : isLoadingAll
  const error = vehicleId ? errorOne : errorAll

  if (isLoading) {
    return <p className="p-12 text-center text-sm text-muted-foreground">Chargement du véhicule...</p>
  }

  if (error || !vehicle) {
    return (
      <p className="p-12 text-center text-sm text-destructive">
        {error ?? 'Aucun véhicule disponible pour le moment.'}
      </p>
    )
  }

  return (
    <ReservationProvider>
      <ProfileAutofill />
      <div className="bg-background text-foreground"
        style={{backgroundImage: "url('/images/bg.webp')"}}>
        <div className="mx-auto max-w-[1240px] px-6 pt-9 md:px-12">
          <div className="mb-2.5 text-[13px] text-muted-foreground">
            Véhicules &nbsp;/&nbsp; <b className="font-medium text-primary">{vehicle.name}</b> &nbsp;/&nbsp; Réservation
          </div>
          <h1 className="text-3xl font-bold uppercase tracking-wide sm:text-[38px]">
            Finalisez votre <span className="text-primary">réservation</span>
          </h1>
          <p className="mt-1.5 text-sm normal-case text-muted-foreground">
            Complétez vos informations pour confirmer la location de votre véhicule.
          </p>
        </div>

        <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-7 px-6 py-8 md:px-12 lg:grid-cols-[1fr_380px]">
          <div>
            <PersonalInfoForm />
            <DateLocationForm vehicleId={vehicle.id} />
            <DocumentsUpload />
          </div>
          <div>
            <VehicleSelector currentVehicleId={vehicle.id} />
            <VehicleSummary vehicle={vehicle} />
          </div>
        </div>
      </div>
    </ReservationProvider>
  )
}