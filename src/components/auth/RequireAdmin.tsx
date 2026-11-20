import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { ReactNode } from 'react'

// Masque l'interface d'administration aux non-admins. La vraie protection des données
// reste côté serveur (RLS et fonctions), cette garde ne sert qu'à l'affichage.
export default function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isAdmin, isLoading, isAdminLoading } = useAuth()

  if (isLoading || isAdminLoading) {
    return <p className="p-12 text-center text-sm text-muted-foreground">Chargement...</p>
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
