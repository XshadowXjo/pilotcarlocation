import VehiclesSection from '../components/home/VehiclesSection'

export default function VehiclesPage() {
  return (
    <div className="bg-background text-foreground">
      <VehiclesSection showAllLink={false} />
    </div>
  )
}