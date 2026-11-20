import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import HomePage from '../pages/HomePage'
import ReservationPage from '../pages/ReservationPage'
import VehiclesPage from '../pages/VehiclesPage'
import ServicesPage from '../pages/ServicesPage'
import ContactPage from '../pages/ContactPage'
import PaymentResultPage from '../pages/PaymentResultPage'
import { MentionsLegalesPage, ConditionsGeneralesPage, ConfidentialitePage } from '../pages/LegalPages'

// Espace client et administration chargés à la demande : le visiteur ne télécharge pas ce code
const AccountPage = lazy(() => import('../pages/AccountPage'))
const AdminLayout = lazy(() => import('../components/layout/AdminLayout'))
const AdminVehiclesPage = lazy(() => import('../pages/admin/AdminVehiclesPage'))
const AdminReservationsPage = lazy(() => import('../pages/admin/AdminReservationsPage'))
const AdminPromotionsPage = lazy(() => import('../pages/admin/AdminPromotionsPage'))

const loading = <p className="p-12 text-center text-sm text-muted-foreground">Chargement...</p>

export default function AppRouter() {
  return (
    <Suspense fallback={loading}>
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
        <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
        <Route path="/conditions-generales" element={<ConditionsGeneralesPage />} />
        <Route path="/confidentialite" element={<ConfidentialitePage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/vehicules" replace />} />
          <Route path="vehicules" element={<AdminVehiclesPage />} />
          <Route path="reservations" element={<AdminReservationsPage />} />
          <Route path="promotions" element={<AdminPromotionsPage />} />
        </Route>
      </Route>
    </Routes>
    </Suspense>
  )
}