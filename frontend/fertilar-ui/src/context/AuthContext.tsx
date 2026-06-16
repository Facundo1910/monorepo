import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { getTokens, signOut } from '../lib/auth'

type Usuario = {
  username: string
  email: string
}

type AuthContextType = {
  usuario: Usuario | null
  loading: boolean
  logout: () => void
  setUsuario: (u: Usuario) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTokens().then((tokens) => {
      if (tokens) {
        try {
          const payload = JSON.parse(atob(tokens.idToken.split('.')[1]))
          setUsuario({
            username: payload['cognito:username'] ?? payload.email ?? '',
            email: payload.email ?? '',
          })
        } catch {
          setUsuario(null)
        }
      }
      setLoading(false)
    })
  }, [])

  const logout = () => {
    signOut()
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, loading, logout, setUsuario }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
