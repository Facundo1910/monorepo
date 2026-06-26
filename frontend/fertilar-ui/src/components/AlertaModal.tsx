import { useState } from 'react'
import { X } from 'lucide-react'
import type { Alerta } from '../types/alerta'
import type { PilaResumen } from '../types/pila'
import styles from './PilaModal.module.css'

type AlertaModalProps = {
  open: boolean
  alerta: Alerta | null
  pila?: PilaResumen
  onClose: () => void
  onResolve: (id: string) => Promise<void>
}

const NIVEL_LABEL: Record<Alerta['nivel'], string> = {
  INFO: 'Info',
  ADVERTENCIA: 'Advertencia',
  CRITICA: 'Crítica',
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function parseApiError(err: unknown): string {
  if (!(err instanceof Error)) return 'No se pudo resolver la alerta.'
  try {
    const parsed = JSON.parse(err.message) as { error?: string }
    if (parsed.error) return parsed.error
  } catch {
    /* not JSON */
  }
  return err.message || 'No se pudo resolver la alerta.'
}

export default function AlertaModal({
  open,
  alerta,
  pila,
  onClose,
  onResolve,
}: AlertaModalProps) {
  const [error, setError] = useState('')
  const [resolving, setResolving] = useState(false)

  if (!open || !alerta) return null

  const handleResolve = async () => {
    setResolving(true)
    setError('')
    try {
      await onResolve(alerta.id)
      onClose()
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setResolving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>detalle de alerta</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className={styles.formShell}>
          <div className={styles.formBody}>
            <div className={styles.form}>
              {error && <div className={styles.error}>{error}</div>}

              <div className={styles.field}>
                <span className={styles.label}>nivel</span>
                <span className={styles.input}>{NIVEL_LABEL[alerta.nivel]}</span>
              </div>

              <div className={styles.field}>
                <span className={styles.label}>tipo</span>
                <span className={styles.input}>{alerta.tipo}</span>
              </div>

              <div className={styles.field}>
                <span className={styles.label}>pila</span>
                <span className={styles.input}>{pila?.nombre ?? 'pila desconocida'}</span>
              </div>

              <div className={styles.field}>
                <span className={styles.label}>mensaje</span>
                <span className={styles.textarea} style={{ minHeight: 'auto' }}>{alerta.mensaje}</span>
              </div>

              <div className={styles.field}>
                <span className={styles.label}>fecha</span>
                <span className={styles.input}>{formatDateTime(alerta.createdAt)}</span>
              </div>

              <div className={styles.field}>
                <span className={styles.label}>estado</span>
                <span className={styles.input}>{alerta.resuelta ? 'Resuelta' : 'Pendiente'}</span>
              </div>
            </div>
          </div>

          <div className={styles.formFooter}>
            <div className={styles.actions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>
                cerrar
              </button>
              {!alerta.resuelta && (
                <button
                  type="button"
                  className={styles.submitBtn}
                  onClick={handleResolve}
                  disabled={resolving}
                >
                  {resolving ? 'resolviendo…' : 'marcar resuelta'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
