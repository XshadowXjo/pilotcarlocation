import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { ReactNode } from 'react'

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isAdmin, isLoading, isAdminLoading } = useAuth()
  
  if (isLoading) {
    return <p className="p-12 text-center text-sm text-muted-foreground">Chargement...</p>
  }

  if (isLoading || isAdminLoading) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}