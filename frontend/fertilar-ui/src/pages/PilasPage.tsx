import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import PilaModal from '../components/PilaModal'
import { createPila, deletePila, getPila, listPilas, updatePila } from '../lib/pilas'
import type { Pila, PilaEstado, PilaRequest, PilaResumen } from '../types/pila'
import styles from './PilasPage.module.css'

const ESTADO_LABEL: Record<PilaEstado, string> = {
  ACTIVA: 'activa',
  PAUSADA: 'en pausa',
  FINALIZADA: 'finalizada',
}

function formatCodigo(index: number): string {
  return `P-${String(index + 1).padStart(2, '0')}`
}

function formatDate(date: string): string {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

export default function PilasPage() {
  const [pilas, setPilas] = useState<PilaResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPila, setEditingPila] = useState<Pila | null>(null)

  const loadPilas = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listPilas()
      setPilas(data)
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
      setError(err instanceof Error ? err.message : 'No se pudo cargar la pila.')
    }
  }

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return
    try {
      await deletePila(id)
      await loadPilas()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la pila.')
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
          <h1 className={styles.heading}>pilas</h1>
          <p className={styles.sub}>
            Una pila, un sensor. Podés vincularlo o dejarlo deshabilitado sin perder el vínculo.
          </p>
        </div>
        <button type="button" className={styles.addBtn} onClick={handleNew} aria-label="Nueva pila">
          <Plus size={22} strokeWidth={1.5} />
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.sheet}>
        <div className={styles.sheetInner}>
          {loading ? (
            <div className={styles.loading}>cargando…</div>
          ) : pilas.length === 0 ? (
            <div className={styles.empty}>
              Todavía no hay pilas.
              <br />
              Tocá + para crear la primera.
            </div>
          ) : (
            <>
              <div className={styles.listMeta}>
                <span>registradas</span>
                <span className={styles.count}>{pilas.length}</span>
              </div>
              <div className={styles.list}>
                {pilas.map((pila, index) => (
                  <article key={pila.id} className={styles.card}>
                    <span className={styles.code}>{formatCodigo(index)}</span>
                    <div className={styles.info}>
                      <span className={styles.name}>{pila.nombre}</span>
                      <span className={styles.meta}>
                        {pila.ubicacion ?? 'sin ubicación'} · {formatDate(pila.fechaInicio)}
                      </span>
                    </div>
                    <span
                      className={`${styles.status} ${pila.estado === 'PAUSADA' ? styles.statusPausa : ''} ${pila.estado === 'FINALIZADA' ? styles.statusFinal : ''}`}
                    >
                      {ESTADO_LABEL[pila.estado]}
                    </span>
                    <div className={styles.actions}>
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
                        onClick={() => handleDelete(pila.id, pila.nombre)}
                        aria-label={`Eliminar ${pila.nombre}`}
                      >
                        <Trash2 size={15} strokeWidth={1.5} />
                      </button>
                    </div>
                  </article>
                ))}
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
