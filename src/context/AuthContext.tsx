import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../services/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthContextValue {
  user: User | null
  isAdmin: boolean
  isAdminLoading: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminCheckedFor, setAdminCheckedFor] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAdminLoading = !!user && adminCheckedFor !== user.id

  useEffect(() => {
    async function loadAdminStatus() {
      if (!user) {
        setIsAdmin(false)
        setAdminCheckedFor(null)
        return
      }
      const { data } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .maybeSingle()
      setIsAdmin(data?.is_admin ?? false)
      setAdminCheckedFor(user.id)
    }

    loadAdminStatus()
  }, [user])


  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setIsLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw new Error(error.message)
    return { needsEmailConfirmation: !data.session }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin, isAdminLoading, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider')
  return context
}