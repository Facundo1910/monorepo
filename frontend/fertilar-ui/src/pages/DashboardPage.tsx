import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './DashboardPage.module.css'

const MODULES = [
  { to: '/pilas', label: 'pilas', enabled: true },
  { to: '/sensores', label: 'sensores', enabled: false },
  { to: '/alertas', label: 'alertas', enabled: false },
  { to: '/certificados', label: 'certificados', enabled: false },
]

export default function DashboardPage() {
  const { usuario } = useAuth()

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>inicio</h1>

      <div className={styles.card}>
        <p className={styles.greeting}>
          hola, {usuario?.username}
        </p>
        <p className={styles.text}>
          Elegí un módulo del menú o desde acá.
        </p>

        <div className={styles.links}>
          {MODULES.map((m) =>
            m.enabled ? (
              <Link key={m.to} to={m.to} className={`${styles.link} ${styles.linkActive}`}>
                {m.label}
              </Link>
            ) : (
              <span key={m.to} className={styles.link}>
                {m.label}
                <span className={styles.soon}>pronto</span>
              </span>
            ),
          )}
        </div>
      </div>
    </div>
  )
}
