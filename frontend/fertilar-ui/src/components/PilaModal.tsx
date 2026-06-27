import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { Pila, PilaEstado, PilaRequest } from '../types/pila'
import styles from './PilaModal.module.css'

type PilaModalProps = {
  open: boolean
  pila?: Pila | null
  onClose: () => void
  onSave: (data: PilaRequest) => Promise<void>
}

const ESTADOS: { value: PilaEstado; label: string }[] = [
  { value: 'ACTIVA', label: 'Activa' },
  { value: 'PAUSADA', label: 'En pausa' },
  { value: 'FINALIZADA', label: 'Finalizada' },
]

const emptyForm = (): PilaRequest => ({
  nombre: '',
  descripcion: '',
  ubicacion: '',
  fechaInicio: new Date().toISOString().slice(0, 10),
  fechaFin: '',
  estado: 'ACTIVA',
})

export default function PilaModal({ open, pila, onClose, onSave }: PilaModalProps) {
  const [form, setForm] = useState<PilaRequest>(emptyForm())
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (pila) {
      setForm({
        nombre: pila.nombre,
        descripcion: pila.descripcion ?? '',
        ubicacion: pila.ubicacion ?? '',
        fechaInicio: pila.fechaInicio,
        fechaFin: pila.fechaFin ?? '',
        estado: pila.estado,
      })
    } else {
      setForm(emptyForm())
    }
    setError('')
  }, [open, pila])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload: PilaRequest = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion?.trim() || undefined,
        ubicacion: form.ubicacion?.trim() || undefined,
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin?.trim() || undefined,
        estado: form.estado,
      }
      await onSave(payload)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{pila ? 'editar' : 'nueva pila'}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <form className={styles.formShell} onSubmit={handleSubmit}>
          <div className={styles.formBody}>
            <div className={styles.form}>
              {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="pila-nombre">nombre</label>
            <input
              id="pila-nombre"
              className={styles.input}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="pila-ubicacion">ubicación</label>
            <input
              id="pila-ubicacion"
              className={styles.input}
              value={form.ubicacion ?? ''}
              onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="pila-descripcion">notas</label>
            <textarea
              id="pila-descripcion"
              className={styles.textarea}
              value={form.descripcion ?? ''}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="pila-fecha-inicio">inicio</label>
              <input
                id="pila-fecha-inicio"
                type="date"
                className={styles.input}
                value={form.fechaInicio}
                onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="pila-fecha-fin">fin</label>
              <input
                id="pila-fecha-fin"
                type="date"
                className={styles.input}
                value={form.fechaFin ?? ''}
                onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="pila-estado">estado</label>
            <select
              id="pila-estado"
              className={styles.select}
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value as PilaEstado })}
            >
              {ESTADOS.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>
            </div>
          </div>

          <div className={styles.formFooter}>
            <div className={styles.actions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>
                cancelar
              </button>
              <button type="submit" className={styles.submitBtn} disabled={saving}>
                {saving ? 'guardando…' : 'guardar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
