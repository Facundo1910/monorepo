import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import styles from './PilaModal.module.css'

type CertificadoModalProps = {
  open: boolean
  pilaNombre: string
  onClose: () => void
  onConfirm: (observaciones?: string) => Promise<void>
}

export default function CertificadoModal({
  open,
  pilaNombre,
  onClose,
  onConfirm,
}: CertificadoModalProps) {
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setObservaciones('')
    setError('')
  }, [open])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onConfirm(observaciones.trim() || undefined)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo emitir el certificado.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Emitir certificado</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <form className={styles.formShell} onSubmit={handleSubmit}>
          <div className={styles.formBody}>
            <div className={styles.form}>
              {error && <div className={styles.error}>{error}</div>}

              <p className={styles.hint}>
                Se generará un certificado para <strong>{pilaNombre}</strong> con los promedios de
                las lecturas registradas.
              </p>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="cert-observaciones">
                  observaciones
                </label>
                <textarea
                  id="cert-observaciones"
                  className={styles.textarea}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </div>

          <div className={styles.formFooter}>
            <div className={styles.actions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>
                cancelar
              </button>
              <button type="submit" className={styles.submitBtn} disabled={saving}>
                {saving ? 'emitiendo…' : 'confirmar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
