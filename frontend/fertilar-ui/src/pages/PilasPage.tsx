import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronRight, Pencil, Plus, PauseCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import ListSearchBar from '../components/ListSearchBar'
import PilaModal from '../components/PilaModal'
import { useDialog } from '../context/DialogContext'
import { createPila, getPila, listPilas, updatePila } from '../lib/pilas'
import { listSensores } from '../lib/sensores'
import type { Pila, PilaEstado, PilaRequest, PilaResumen } from '../types/pila'
import type { SensorResumen } from '../types/sensor'
import { matchesSearch } from '../utils/searchText'
import styles from './PilasPage.module.css'

const ESTADO_LABEL: Record<PilaEstado, string> = {
  ACTIVA: 'Activa',
  PAUSADA: 'En pausa',
  FINALIZADA: 'Finalizada',
}

function formatCodigo(index: number): string {
  return `P-${String(index + 1).padStart(2, '0')}`
}

function toRequest(pila: Pila, overrides: Partial<PilaRequest> = {}): PilaRequest {
  return {
    nombre: pila.nombre,
    descripcion: pila.descripcion ?? undefined,
    ubicacion: pila.ubicacion ?? undefined,
    fechaInicio: pila.fechaInicio,
    fechaFin: pila.fechaFin ?? undefined,
    diasEstimados: pila.diasEstimados,
    humedadObjetivo: pila.humedadObjetivo,
    temperaturaObjetivo: pila.temperaturaObjetivo,
    estado: pila.estado,
    ...overrides,
  }
}

export default function PilasPage() {
  const dialog = useDialog()
  const [pilas, setPilas] = useState<PilaResumen[]>([])
  const [sensores, setSensores] = useState<SensorResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPila, setEditingPila] = useState<Pila | null>(null)
  const [search, setSearch] = useState('')

  const sensorPorPila = useMemo(
    () => new Map(sensores.map((s) => [s.pilaId, s])),
    [sensores],
  )

  const pilasFiltradas = useMemo(
    () =>
      pilas
        .map((pila, index) => ({ pila, index }))
        .filter(({ pila, index }) => {
          const sensor = sensorPorPila.get(pila.id)
          return matchesSearch(
            search,
            formatCodigo(index),
            pila.nombre,
            pila.ubicacion,
            ESTADO_LABEL[pila.estado],
            sensor?.codigo,
            sensor ? 'con sensor' : 'sin sensor',
          )
        }),
    [pilas, sensorPorPila, search],
  )

  const loadPilas = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [pilasData, sensoresData] = await Promise.all([listPilas(), listSensores()])
      setPilas(pilasData)
      setSensores(sensoresData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las pilas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPilas()
  }, [loadPilas])

  const handleNew = () => {
    setEditingPila(null)
    setModalOpen(true)
  }

  const handleEdit = async (id: string) => {
    try {
      const pila = await getPila(id)
      setEditingPila(pila)
      setModalOpen(true)
    } catch (err) {
      await dialog.error(
        err instanceof Error ? err.message : 'No se pudo cargar la pila.',
      )
    }
  }

  const handleInactivate = async (id: string, nombre: string) => {
    const ok = await dialog.confirm(
      `¿Inactivar "${nombre}"? La pila quedará en pausa.`,
      'Inactivar pila',
      { confirmLabel: 'Inactivar' },
    )
    if (!ok) return
    try {
      const pila = await getPila(id)
      await updatePila(id, toRequest(pila, { estado: 'PAUSADA' }))
      await loadPilas()
    } catch (err) {
      await dialog.error(
        err instanceof Error ? err.message : 'No se pudo inactivar la pila.',
      )
    }
  }

  const handleSave = async (data: PilaRequest) => {
    if (editingPila) {
      await updatePila(editingPila.id, data)
    } else {
      await createPila(data)
    }
    await loadPilas()
  }

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <div>
          <h1 className={styles.heading}>Pilas</h1>
          <p className={styles.sub}>
            Una pila, un sensor. Podés vincularlo o dejarlo deshabilitado sin perder el vínculo.
          </p>
        </div>
        <button type="button" className={styles.addBtn} onClick={handleNew} aria-label="Nueva pila">
          <Plus size={22} strokeWidth={1.5} />
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {!loading && (
        <div className={styles.toolbar}>
          <ListSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, ubicación, sensor o estado…"
          />
        </div>
      )}

      <div className={styles.sheet}>
        <div className={styles.sheetInner}>
          {loading ? (
            <div className={styles.loading}>Cargando…</div>
          ) : pilas.length === 0 ? (
            <div className={styles.empty}>
              Todavía no hay pilas.
              <br />
              Tocá + para crear la primera.
            </div>
          ) : pilasFiltradas.length === 0 ? (
            <div className={styles.empty}>No hay pilas que coincidan con la búsqueda.</div>
          ) : (
            <>
              <div className={styles.listMeta}>
                <span>Registradas</span>
                <span className={styles.count}>{pilasFiltradas.length}</span>
              </div>
              <div className={styles.list}>
                {pilasFiltradas.map(({ pila, index }) => {
                  const sensor = sensorPorPila.get(pila.id)
                  const canInactivate = pila.estado === 'ACTIVA'
                  return (
                    <article key={pila.id} className={styles.card}>
                      <span className={styles.code}>{formatCodigo(index)}</span>
                      <Link to={`/pilas/${pila.id}`} className={styles.info}>
                        <span className={styles.name}>{pila.nombre}</span>
                        <span className={styles.meta}>
                          {pila.ubicacion ?? 'Sin ubicación'}
                          {' · '}
                          {sensor ? `Sensor ${sensor.codigo}` : 'Sin sensor'}
                        </span>
                      </Link>
                      <span
                        className={`${styles.status} ${pila.estado === 'PAUSADA' ? styles.statusPausa : ''} ${pila.estado === 'FINALIZADA' ? styles.statusFinal : ''}`}
                      >
                        {ESTADO_LABEL[pila.estado]}
                      </span>
                      <div className={styles.actions}>
                        <Link
                          to={`/pilas/${pila.id}`}
                          className={styles.actionBtn}
                          aria-label={`Ver detalle de ${pila.nombre}`}
                        >
                          <ChevronRight size={15} strokeWidth={1.5} />
                        </Link>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => handleEdit(pila.id)}
                          aria-label={`Editar ${pila.nombre}`}
                        >
                          <Pencil size={15} strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          onClick={() => handleInactivate(pila.id, pila.nombre)}
                          aria-label={`Inactivar ${pila.nombre}`}
                          disabled={!canInactivate}
                          title={canInactivate ? 'Inactivar pila' : 'Solo pilas activas'}
                        >
                          <PauseCircle size={15} strokeWidth={1.5} />
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

      {pilas.length > 0 && (
        <p className={styles.note}>
          {pilas.length} {pilas.length === 1 ? 'pila' : 'pilas'} · máx. 1 sensor por pila
        </p>
      )}

      <PilaModal
        open={modalOpen}
        pila={editingPila}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  )
}
