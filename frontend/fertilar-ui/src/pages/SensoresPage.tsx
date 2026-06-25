import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
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

  const pilaPorId = useMemo(
    () => new Map(pilas.map((p) => [p.id, p])),
    [pilas],
  )

  const pilasSinSensor = useMemo(() => {
    const ocupadas = new Set(sensores.map((s) => s.pilaId))
    return pilas.filter((p) => !ocupadas.has(p.id)).length
  }, [pilas, sensores])

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
          <h1 className={styles.heading}>sensores</h1>
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
          ) : (
            <>
              <div className={styles.listMeta}>
                <span>registrados</span>
                <span className={styles.count}>{sensores.length}</span>
              </div>
              <div className={styles.list}>
                {sensores.map((sensor) => {
                  const pila = pilaPorId.get(sensor.pilaId)
                  return (
                    <article key={sensor.id} className={styles.card}>
                      <span className={styles.code}>{sensor.codigo}</span>
                      <div className={styles.info}>
                        <span className={styles.name}>{formatTipo(sensor.tipo)}</span>
                        <span className={styles.meta}>
                          {pila?.nombre ?? 'pila desconocida'}
                          {pila?.ubicacion ? ` · ${pila.ubicacion}` : ''}
                        </span>
                      </div>
                      <span
                        className={`${styles.status} ${!sensor.activo ? styles.statusInactive : ''}`}
                      >
                        {sensor.activo ? 'activo' : 'inactivo'}
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

      {sensores.length > 0 && (
        <p className={styles.note}>
          {sensores.length} {sensores.length === 1 ? 'sensor' : 'sensores'}
          {pilasSinSensor > 0 && ` · ${pilasSinSensor} ${pilasSinSensor === 1 ? 'pila libre' : 'pilas libres'}`}
        </p>
      )}

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
