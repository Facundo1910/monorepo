import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Activity,
  Award,
  Bell,
  LayoutGrid,
  Layers,
  LogOut,
  Menu,
  Radio,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getCurrentUsuario } from '../lib/usuarios'
import type { UsuarioRol } from '../types/usuario'
import AppBrand from './AppBrand'
import styles from './AppLayout.module.css'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'inicio', icon: LayoutGrid, enabled: true, adminOnly: false },
  { to: '/pilas', label: 'pilas', icon: Layers, enabled: true, adminOnly: false },
  { to: '/sensores', label: 'sensores', icon: Radio, enabled: true, adminOnly: false },
  { to: '/alertas', label: 'alertas', icon: Bell, enabled: true, adminOnly: false },
  { to: '/lecturas', label: 'lecturas', icon: Activity, enabled: true, adminOnly: false },
  { to: '/umbrales', label: 'umbrales', icon: SlidersHorizontal, enabled: true, adminOnly: false },
  { to: '/certificados', label: 'certificados', icon: Award, enabled: true, adminOnly: false },
  { to: '/usuarios', label: 'usuarios', icon: Users, enabled: true, adminOnly: true },
] as const

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [rol, setRol] = useState<UsuarioRol | null>(null)
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    getCurrentUsuario()
      .then((perfil) => setRol(perfil.rol))
      .catch(() => setRol(null))
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const closeMenu = () => setMenuOpen(false)

  const visibleNavItems = NAV_ITEMS.filter((item) => !item.adminOnly || rol === 'ADMIN')

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>
          <AppBrand />
        </div>

        <div className={styles.userArea}>
          <div className={styles.avatar}>
            {usuario ? getInitials(usuario.username) : '??'}
          </div>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={handleLogout}
            aria-label="Cerrar sesión"
          >
            <LogOut size={18} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className={styles.overlay} onClick={closeMenu} aria-hidden="true" />
      )}

      <nav
        className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ''}`}
        aria-label="Navegación principal"
      >
        <div className={styles.sidebarTop}>
          <AppBrand />
          <button
            type="button"
            className={styles.iconBtn}
            onClick={closeMenu}
            aria-label="Cerrar menú"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className={styles.nav}>
          {visibleNavItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.enabled ? item.to : '#'}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive && item.enabled ? styles.navLinkActive : ''} ${!item.enabled ? styles.navDisabled : ''}`
                }
                onClick={(e) => {
                  if (!item.enabled) e.preventDefault()
                  else closeMenu()
                }}
              >
                <Icon size={18} strokeWidth={1.5} />
                {item.label}
                {!item.enabled && <span className={styles.soon}>pronto</span>}
              </NavLink>
            )
          })}
        </div>

        <div className={styles.sidebarFooter}>
          <button type="button" className={styles.logoutLink} onClick={handleLogout}>
            <LogOut size={18} strokeWidth={1.5} />
            cerrar sesión
          </button>
        </div>
      </nav>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
