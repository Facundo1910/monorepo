import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import LecturaDetailModal from '../components/LecturaDetailModal'
import LecturaModal from '../components/LecturaModal'
import { createLectura, listLecturas, listLecturasPorSensor } from '../lib/lecturas'
import { listSensores } from '../lib/sensores'
import type { Lectura, LecturaRequest } from '../types/lectura'
import type { SensorResumen } from '../types/sensor'
import styles from './LecturasPage.module.css'

const PAGE_SIZE = 20

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatMetric(value: number | null | undefined, label: string, unit = ''): string | null {
  if (value === null || value === undefined) return null
  return `${label} ${value}${unit}`
}

function summarizeMetrics(lectura: Lectura): string {
  const parts = [
    formatMetric(lectura.temperatura, 'temp.', '°C'),
    formatMetric(lectura.humedad, 'hum.', '%'),
    formatMetric(lectura.ph, 'pH'),
    formatMetric(lectura.nitrogeno, 'N'),
    formatMetric(lectura.fosforo, 'P'),
    formatMetric(lectura.potasio, 'K'),
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : 'sin mediciones'
}

export default function LecturasPage() {
  const [lecturas, setLecturas] = useState<Lectura[]>([])
  const [sensores, setSensores] = useState<SensorResumen[]>([])
  const [sensorFilter, setSensorFilter] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedLectura, setSelectedLectura] = useState<Lectura | null>(null)

  const sensorPorId = useMemo(
    () => new Map(sensores.map((s) => [s.id, s])),
    [sensores],
  )

  const loadData = useCallback(async (currentPage: number, filterSensorId: string) => {
    setLoading(true)
    setError('')
    try {
      const sensoresData = await listSensores()
      setSensores(sensoresData)

      if (filterSensorId) {
        const data = await listLecturasPorSensor(filterSensorId, { limit: 50 })
        setLecturas(data)
        setTotalPages(1)
        setTotalElements(data.length)
      } else {
        const data = await listLecturas(currentPage, PAGE_SIZE)
        setLecturas(data.content)
        setTotalPages(data.totalPages)
        setTotalElements(data.totalElements)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las lecturas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(page, sensorFilter)
  }, [page, sensorFilter, loadData])

  const handleSensorFilterChange = (value: string) => {
    setSensorFilter(value)
    setPage(0)
  }

  const handleSave = async (data: LecturaRequest) => {
    await createLectura(data)
    setPage(0)
    await loadData(0, sensorFilter)
  }

  const emptyMessage = sensorFilter
    ? 'Este sensor no tiene lecturas registradas.'
    : sensores.length === 0
      ? 'Primero registrá un sensor para poder cargar lecturas.'
      : 'Todavía no hay lecturas.\nTocá + para registrar la primera.'

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <div>
          <h1 className={styles.heading}>lecturas</h1>
          <p className={styles.sub}>
            Mediciones de sensores: temperatura, humedad, nutrientes y más.
          </p>
        </div>
        <button
          type="button"
          className={styles.addBtn}
          onClick={() => setCreateOpen(true)}
          aria-label="Nueva lectura"
          disabled={!loading && sensores.length === 0}
        >
          <Plus size={22} strokeWidth={1.5} />
        </button>
      </div>

      <div className={styles.filters}>
        <select
          className={styles.filterSelect}
          value={sensorFilter}
          onChange={(e) => handleSensorFilterChange(e.target.value)}
        >
          <option value="">todos los sensores</option>
          {sensores.map((s) => (
            <option key={s.id} value={s.id}>{s.codigo} · {s.tipo}</option>
          ))}
        </select>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.sheet}>
        <div className={styles.sheetInner}>
          {loading ? (
            <div className={styles.loading}>cargando…</div>
          ) : lecturas.length === 0 ? (
            <div className={styles.empty}>
              {emptyMessage.split('\n').map((line, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  {line}
                </span>
              ))}
            </div>
          ) : (
            <>
              <div className={styles.listMeta}>
                <span>{sensorFilter ? 'últimas lecturas' : 'registradas'}</span>
                <span className={styles.count}>
                  {sensorFilter ? lecturas.length : totalElements}
                </span>
              </div>
              <div className={styles.list}>
                {lecturas.map((lectura) => {
                  const sensor = sensorPorId.get(lectura.sensorId)
                  return (
                    <button
                      key={lectura.id}
                      type="button"
                      className={styles.card}
                      onClick={() => setSelectedLectura(lectura)}
                    >
                      <span className={styles.time}>{formatTime(lectura.timestamp)}</span>
                      <div className={styles.info}>
                        <span className={styles.sensor}>
                          {sensor?.codigo ?? 'sensor desconocido'}
                        </span>
                        <span className={styles.metrics}>{summarizeMetrics(lectura)}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {!sensorFilter && totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0 || loading}
          >
            anterior
          </button>
          <span className={styles.pageInfo}>
            página {page + 1} de {totalPages}
          </span>
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages - 1 || loading}
          >
            siguiente
          </button>
        </div>
      )}

      {lecturas.length > 0 && (
        <p className={styles.note}>
          {sensorFilter
            ? `${lecturas.length} ${lecturas.length === 1 ? 'lectura' : 'lecturas'} del sensor`
            : `${totalElements} ${totalElements === 1 ? 'lectura' : 'lecturas'} en total`}
        </p>
      )}

      <LecturaModal
        open={createOpen}
        sensores={sensores}
        onClose={() => setCreateOpen(false)}
        onSave={handleSave}
      />

      <LecturaDetailModal
        open={selectedLectura !== null}
        lectura={selectedLectura}
        sensor={selectedLectura ? sensorPorId.get(selectedLectura.sensorId) : undefined}
        onClose={() => setSelectedLectura(null)}
      />
    </div>
  )
}
