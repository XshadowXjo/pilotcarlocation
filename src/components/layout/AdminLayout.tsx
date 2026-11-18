import { NavLink, Outlet } from 'react-router-dom'
import RequireAdmin from '../auth/RequireAdmin'

const adminLinks = [
  { label: 'Véhicules', to: '/admin/vehicules' },
  { label: 'Réservations', to: '/admin/reservations' },
  { label: 'Promotions', to: '/admin/promotions' },
]

export default function AdminLayout() {
  return (
    <RequireAdmin>
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex flex-col md:flex-row">
          <aside className="border-b border-border p-4 md:w-56 md:border-b-0 md:border-r md:p-6">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-primary">Administration</p>
            <nav className="flex gap-2 overflow-x-auto md:flex-col md:gap-1">
              {adminLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </aside>
          <main className="flex-1 p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </RequireAdmin>
  )
}