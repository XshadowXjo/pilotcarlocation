import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import HomePage from '../pages/HomePage'
import ReservationPage from '../pages/ReservationPage'
import VehiclesPage from '../pages/VehiclesPage'
import ServicesPage from '../pages/ServicesPage'
import ContactPage from '../pages/ContactPage'
import AccountPage from '../pages/AccountPage'
import AdminLayout from '../components/layout/AdminLayout'
import AdminVehiclesPage from '../pages/admin/AdminVehiclesPage'
import AdminReservationsPage from '../pages/admin/AdminReservationsPage'
import AdminPromotionsPage from '../pages/admin/AdminPromotionsPage'
import PaymentResultPage from '../pages/PaymentResultPage'

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
        <Route path="/compte" element={<AccountPage />} />
        <Route path="/paiement/:result" element={<PaymentResultPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/vehicules" replace />} />
          <Route path="vehicules" element={<AdminVehiclesPage />} />
          <Route path="reservations" element={<AdminReservationsPage />} />
          <Route path="promotions" element={<AdminPromotionsPage />} />
        </Route>
      </Route>
    </Routes>
  )
}