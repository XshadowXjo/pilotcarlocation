import Hero from '../components/home/Hero'
import QuickBookingWizard from '../components/home/QuickBookingWizard'
import AdvantagesList from '../components/home/AdvantagesList'
import VehiclesSection from '../components/home/VehiclesSection'
import PromoBanner from '../components/home/PromoBanner'
import Footer from '../components/home/Footer'

export default function HomePage() {
  return (
    <div className="bg-background text-foreground font-sans">
      <Hero />
      <VehiclesSection />
      <AdvantagesList />
      <QuickBookingWizard />      
      <PromoBanner />
      <Footer />
    </div>
  )
}