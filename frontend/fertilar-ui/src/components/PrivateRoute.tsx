import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { usuario, loading } = useAuth()

  if (loading) return null

  return usuario ? <>{children}</> : <Navigate to="/login" replace />
}
