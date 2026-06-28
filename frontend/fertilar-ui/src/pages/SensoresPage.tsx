import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import ListSearchBar from '../components/ListSearchBar'
import SensorModal from '../components/SensorModal'
import { useDialog } from '../context/DialogContext'
import { listPilas } from '../lib/pilas'
import {
  createSensor,
  deleteSensor,
  getSensor,
  listSensores,
  updateSensor,
} from '../lib/sensores'
import type { PilaResumen } from '../types/pila'
import type { Sensor, SensorRequest, SensorResumen } from '../types/sensor'
import { matchesSearch } from '../utils/searchText'
import styles from './SensoresPage.module.css'

const TIPO_LABEL: Record<string, string> = {
  NPK: 'NPK',
  TEMP_HUM: 'temp. / humedad',
  PH: 'pH',
  CONDUCTIVIDAD: 'conductividad',
}

function formatTipo(tipo: string): string {
  return TIPO_LABEL[tipo] ?? tipo.toLowerCase()
}

export default function SensoresPage() {
  const dialog = useDialog()
  const [sensores, setSensores] = useState<SensorResumen[]>([])
  const [pilas, setPilas] = useState<PilaResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null)
  const [search, setSearch] = useState('')

  const pilaPorId = useMemo(
    () => new Map(pilas.map((p) => [p.id, p])),
    [pilas],
  )

  const pilasSinSensor = useMemo(() => {
    const ocupadas = new Set(sensores.map((s) => s.pilaId))
    return pilas.filter((p) => !ocupadas.has(p.id)).length
  }, [pilas, sensores])

  const resumen = useMemo(() => {
    const activos = sensores.filter((s) => s.activo).length
    return {
      total: sensores.length,
      activos,
      inactivos: sensores.length - activos,
      pilasLibres: pilasSinSensor,
    }
  }, [sensores, pilasSinSensor])

  const sensoresFiltrados = useMemo(
    () =>
      sensores.filter((sensor) => {
        const pila = pilaPorId.get(sensor.pilaId)
        return matchesSearch(
          search,
          sensor.codigo,
          sensor.tipo,
          formatTipo(sensor.tipo),
          pila?.nombre,
          pila?.ubicacion,
          sensor.activo ? 'activo' : 'inactivo',
        )
      }),
    [sensores, pilaPorId, search],
  )

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [sensoresData, pilasData] = await Promise.all([listSensores(), listPilas()])
      setSensores(sensoresData)
      setPilas(pilasData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los sensores.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleNew = () => {
    setEditingSensor(null)
    setModalOpen(true)
  }

  const handleEdit = async (id: string) => {
    try {
      const sensor = await getSensor(id)
      setEditingSensor(sensor)
      setModalOpen(true)
    } catch (err) {
      await dialog.error(
        err instanceof Error ? err.message : 'No se pudo cargar el sensor.',
      )
    }
  }

  const handleDelete = async (id: string, codigo: string) => {
    const ok = await dialog.confirm(
      `¿Eliminar el sensor "${codigo}"? Esta acción no se puede deshacer.`,
      'eliminar sensor',
      { destructive: true, confirmLabel: 'eliminar' },
    )
    if (!ok) return
    try {
      await deleteSensor(id)
      await loadData()
    } catch (err) {
      await dialog.error(
        err instanceof Error ? err.message : 'No se pudo eliminar el sensor.',
      )
    }
  }

  const handleSave = async (data: SensorRequest) => {
    if (editingSensor) {
      await updateSensor(editingSensor.id, data)
    } else {
      await createSensor(data)
    }
    await loadData()
  }

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <div>
          <h1 className={styles.heading}>Sensores</h1>
          <p className={styles.sub}>
            Cada pila admite un solo sensor. Podés desactivarlo sin perder el vínculo.
          </p>
        </div>
        <button
          type="button"
          className={styles.addBtn}
          onClick={handleNew}
          aria-label="Nuevo sensor"
          disabled={!loading && pilas.length > 0 && pilasSinSensor === 0}
        >
          <Plus size={22} strokeWidth={1.5} />
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {!loading && (
        <div className={styles.toolbar}>
          <ListSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar por código, tipo, pila o estado…"
          />
        </div>
      )}

      <div className={styles.sheet}>
        <div className={styles.sheetInner}>
          {loading ? (
            <div className={styles.loading}>cargando…</div>
          ) : sensores.length === 0 ? (
            <div className={styles.empty}>
              {pilas.length === 0 ? (
                <>
                  Primero creá una pila.
                  <br />
                  Después podés asignarle un sensor acá.
                </>
              ) : (
                <>
                  Todavía no hay sensores.
                  <br />
                  Tocá + para vincular el primero.
                </>
              )}
            </div>
          ) : sensoresFiltrados.length === 0 ? (
            <div className={styles.empty}>No hay sensores que coincidan con la búsqueda.</div>
          ) : (
            <>
              <div className={styles.summary}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryValue}>{resumen.total}</span>
                  <span className={styles.summaryLabel}>Registrados</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryValue}>{resumen.activos}</span>
                  <span className={styles.summaryLabel}>Activos</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryValue}>{resumen.inactivos}</span>
                  <span className={styles.summaryLabel}>Inactivos</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryValue}>{resumen.pilasLibres}</span>
                  <span className={styles.summaryLabel}>Pilas libres</span>
                </div>
              </div>
              <div className={styles.list}>
                {sensoresFiltrados.map((sensor) => {
                  const pila = pilaPorId.get(sensor.pilaId)
                  return (
                    <article key={sensor.id} className={styles.card}>
                      <span className={styles.code}>{sensor.codigo}</span>
                      <div className={styles.info}>
                        <span className={styles.name}>{formatTipo(sensor.tipo)}</span>
                        <span className={styles.meta}>
                          Pila: {pila?.nombre ?? 'Sin pila'}
                          {pila?.ubicacion ? ` · ${pila.ubicacion}` : ''}
                        </span>
                      </div>
                      <span
                        className={`${styles.status} ${!sensor.activo ? styles.statusInactive : ''}`}
                      >
                        {sensor.activo ? 'Activo' : 'Inactivo'}
                      </span>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => handleEdit(sensor.id)}
                          aria-label={`Editar ${sensor.codigo}`}
                        >
                          <Pencil size={15} strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          onClick={() => handleDelete(sensor.id, sensor.codigo)}
                          aria-label={`Eliminar ${sensor.codigo}`}
                        >
                          <Trash2 size={15} strokeWidth={1.5} />
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <SensorModal
        open={modalOpen}
        sensor={editingSensor}
        pilas={pilas}
        sensores={sensores}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  )
}
