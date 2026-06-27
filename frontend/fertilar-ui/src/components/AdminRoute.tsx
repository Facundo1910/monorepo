import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { getCurrentUsuario } from '../lib/usuarios'
import type { UsuarioRol } from '../types/usuario'

type AdminRouteProps = {
  children?: ReactNode
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const [rol, setRol] = useState<UsuarioRol | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUsuario()
      .then((perfil) => setRol(perfil.rol))
      .catch(() => setRol(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--ink-muted)' }}>cargando…</div>
  }

  if (rol !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />
  }

  return children ? <>{children}</> : <Outlet />
}
