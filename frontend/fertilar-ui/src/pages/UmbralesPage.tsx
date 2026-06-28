import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import ListSearchBar from '../components/ListSearchBar'
import UmbralModal, { PARAMETROS } from '../components/UmbralModal'
import { useDialog } from '../context/DialogContext'
import { listPilas } from '../lib/pilas'
import {
  createUmbral,
  deleteUmbral,
  getUmbral,
  listUmbralesPorPila,
  updateUmbral,
} from '../lib/umbrales'
import type { PilaResumen } from '../types/pila'
import type { Umbral, UmbralNivel, UmbralRequest } from '../types/umbral'
import { matchesSearch } from '../utils/searchText'
import styles from './UmbralesPage.module.css'

const NIVEL_LABEL: Record<UmbralNivel, string> = {
  INFO: 'info',
  ADVERTENCIA: 'advertencia',
  CRITICA: 'crítica',
}

const NIVEL_CLASS: Record<UmbralNivel, string> = {
  INFO: styles.nivelInfo,
  ADVERTENCIA: styles.nivelAdvertencia,
  CRITICA: styles.nivelCritica,
}

const parametroMeta = new Map(
  PARAMETROS.map((p) => [p.value, { label: p.label, unit: p.unit }]),
)

function formatRango(umbral: Umbral): string {
  const unit = parametroMeta.get(umbral.parametro)?.unit ?? ''
  const suffix = unit ? ` ${unit}` : ''

  if (umbral.valorMin != null && umbral.valorMax != null) {
    return `${umbral.valorMin} – ${umbral.valorMax}${suffix}`
  }
  if (umbral.valorMin != null) {
    return `≥ ${umbral.valorMin}${suffix}`
  }
  if (umbral.valorMax != null) {
    return `≤ ${umbral.valorMax}${suffix}`
  }
  return 'sin límites'
}

export default function UmbralesPage() {
  const dialog = useDialog()
  const [pilas, setPilas] = useState<PilaResumen[]>([])
  const [pilaId, setPilaId] = useState('')
  const [umbrales, setUmbrales] = useState<Umbral[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUmbral, setEditingUmbral] = useState<Umbral | null>(null)
  const [search, setSearch] = useState('')

  const loadPilas = useCallback(async () => {
    try {
      const data = await listPilas()
      setPilas(data)
      setPilaId((current) => current || data[0]?.id || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las pilas.')
    }
  }, [])

  const loadUmbrales = useCallback(async (selectedPilaId: string) => {
    if (!selectedPilaId) {
      setUmbrales([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await listUmbralesPorPila(selectedPilaId)
      setUmbrales(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los umbrales.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPilas()
  }, [loadPilas])

  useEffect(() => {
    loadUmbrales(pilaId)
  }, [pilaId, loadUmbrales])

  useEffect(() => {
    setSearch('')
  }, [pilaId])

  const selectedPila = pilas.find((p) => p.id === pilaId)
  const activos = umbrales.filter((u) => u.activo).length

  const umbralesFiltrados = useMemo(
    () =>
      umbrales.filter((umbral) => {
        const meta = parametroMeta.get(umbral.parametro)
        return matchesSearch(
          search,
          umbral.parametro,
          meta?.label,
          NIVEL_LABEL[umbral.nivel],
          umbral.nivel,
          formatRango(umbral),
          umbral.activo ? 'activo' : 'inactivo',
        )
      }),
    [umbrales, search],
  )

  const handleNew = () => {
    setEditingUmbral(null)
    setModalOpen(true)
  }

  const handleEdit = async (id: string) => {
    try {
      const umbral = await getUmbral(id)
      setEditingUmbral(umbral)
      setModalOpen(true)
    } catch (err) {
      await dialog.error(
        err instanceof Error ? err.message : 'No se pudo cargar el umbral.',
      )
    }
  }

  const handleDelete = async (id: string, parametro: string) => {
    const label = parametroMeta.get(parametro as Umbral['parametro'])?.label ?? parametro
    const ok = await dialog.confirm(
      `¿Eliminar el umbral de "${label}"? Esta acción no se puede deshacer.`,
      'eliminar umbral',
      { destructive: true, confirmLabel: 'eliminar' },
    )
    if (!ok) return
    try {
      await deleteUmbral(id)
      await loadUmbrales(pilaId)
    } catch (err) {
      await dialog.error(
        err instanceof Error ? err.message : 'No se pudo eliminar el umbral.',
      )
    }
  }

  const handleSave = async (data: UmbralRequest) => {
    if (editingUmbral) {
      await updateUmbral(editingUmbral.id, data)
    } else {
      await createUmbral(pilaId, data)
    }
    await loadUmbrales(pilaId)
  }

  const emptyMessage = pilas.length === 0
    ? 'Primero creá una pila para definir umbrales.'
    : 'Todavía no hay umbrales para esta pila.\nTocá + para agregar el primero.'

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <div>
          <h1 className={styles.heading}>Umbrales</h1>
          <p className={styles.sub}>
            Rangos aceptables por pila. Si una lectura sale de estos límites, se genera una alerta.
          </p>
        </div>
        <button
          type="button"
          className={styles.addBtn}
          onClick={handleNew}
          aria-label="Nuevo umbral"
          disabled={!pilaId}
        >
          <Plus size={22} strokeWidth={1.5} />
        </button>
      </div>

      <div className={styles.filters}>
        <select
          className={styles.filterSelect}
          value={pilaId}
          onChange={(e) => setPilaId(e.target.value)}
          disabled={pilas.length === 0}
        >
          {pilas.length === 0 ? (
            <option value="">Sin pilas disponibles</option>
          ) : (
            pilas.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))
          )}
        </select>
        {!loading && (
          <ListSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar por parámetro, nivel o rango…"
          />
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.sheet}>
        <div className={styles.sheetInner}>
          {loading ? (
            <div className={styles.loading}>cargando…</div>
          ) : umbrales.length === 0 ? (
            <div className={styles.empty}>
              {emptyMessage.split('\n').map((line, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  {line}
                </span>
              ))}
            </div>
          ) : umbralesFiltrados.length === 0 ? (
            <div className={styles.empty}>No hay umbrales que coincidan con la búsqueda.</div>
          ) : (
            <>
              <div className={styles.listMeta}>
                <span>{selectedPila?.nombre ?? 'pila'}</span>
                <span className={styles.count}>{umbralesFiltrados.length}</span>
              </div>
              <div className={styles.list}>
                {umbralesFiltrados.map((umbral) => {
                  const meta = parametroMeta.get(umbral.parametro)
                  return (
                    <article key={umbral.id} className={styles.card}>
                      <span className={`${styles.nivel} ${NIVEL_CLASS[umbral.nivel]}`}>
                        {NIVEL_LABEL[umbral.nivel]}
                      </span>
                      <div className={styles.info}>
                        <span className={styles.parametro}>{meta?.label ?? umbral.parametro}</span>
                        <span className={styles.rango}>{formatRango(umbral)}</span>
                      </div>
                      <span
                        className={`${styles.status} ${!umbral.activo ? styles.statusInactive : ''}`}
                      >
                        {umbral.activo ? 'activo' : 'inactivo'}
                      </span>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => handleEdit(umbral.id)}
                          aria-label={`Editar umbral ${meta?.label ?? umbral.parametro}`}
                        >
                          <Pencil size={15} strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          onClick={() => handleDelete(umbral.id, umbral.parametro)}
                          aria-label={`Eliminar umbral ${meta?.label ?? umbral.parametro}`}
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

      {umbrales.length > 0 && (
        <p className={styles.note}>
          {umbrales.length} {umbrales.length === 1 ? 'umbral' : 'umbrales'}
          {activos !== umbrales.length && ` · ${activos} activos`}
        </p>
      )}

      <UmbralModal
        open={modalOpen}
        umbral={editingUmbral}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  )
}
