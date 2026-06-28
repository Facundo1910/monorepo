import { useCallback, useEffect, useState } from 'react'
import PilaDashboardCard from '../components/PilaDashboardCard'
import { listAlertasPorPila } from '../lib/alertas'
import { listLecturasPorPila } from '../lib/lecturas'
import { getPila, listPilas } from '../lib/pilas'
import type { Alerta } from '../types/alerta'
import type { Lectura } from '../types/lectura'
import type { Pila } from '../types/pila'
import styles from './DashboardPage.module.css'

type PilaDashboardData = {
  pila: Pila
  lecturas: Lectura[]
  alertasPendientes: Alerta[]
}

async function loadPilaDashboard(pilaId: string): Promise<PilaDashboardData> {
  const pila = await getPila(pilaId)
  const desde = `${pila.fechaInicio}T00:00:00`
  const hasta = new Date().toISOString().slice(0, 19)

  const [lecturas, alertasPendientes] = await Promise.all([
    listLecturasPorPila(pilaId, { desde, hasta }),
    listAlertasPorPila(pilaId, false),
  ])
  return { pila, lecturas, alertasPendientes }
}

export default function DashboardPage() {
  const [items, setItems] = useState<PilaDashboardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const pilas = await listPilas()
      const activas = pilas.filter((p) => p.estado === 'ACTIVA')
      const data = await Promise.all(activas.map((p) => loadPilaDashboard(p.id)))
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <h1 className={styles.heading}>Dashboard</h1>
        <p className={styles.sub}>
          Monitoreo de las pilas activas — evolución del proceso desde el inicio hasta el fin estimado.
        </p>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.loading}>Cargando pilas activas…</p>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <p>No hay pilas activas en este momento.</p>
          <p className={styles.emptyHint}>Creá una pila o reactivá una existente desde la sección pilas.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {items.map((item) => (
            <PilaDashboardCard
              key={item.pila.id}
              pila={item.pila}
              lecturas={item.lecturas}
              alertasPendientes={item.alertasPendientes}
            />
          ))}
        </div>
      )}
    </div>
  )
}
