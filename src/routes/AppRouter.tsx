import { Routes, Route } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import HomePage from '../pages/HomePage'
import ReservationPage from '../pages/ReservationPage'
import VehiclesPage from '../pages/VehiclesPage'
import ServicesPage from '../pages/ServicesPage'
import ContactPage from '../pages/ContactPage'
export default function AppRouter() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/vehicules" element={<VehiclesPage />} />
        <Route path="/reservation" element={<ReservationPage />} />
        <Route path="/reservation/:vehicleId" element={<ReservationPage />} />
        <Route path="/tarifs-services" element={<ServicesPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>
    </Routes>
  )
}