import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import type { PilaResumen } from '../types/pila'
import type { Sensor, SensorRequest, SensorResumen } from '../types/sensor'
import styles from './PilaModal.module.css'

type SensorModalProps = {
  open: boolean
  sensor?: Sensor | null
  pilas: PilaResumen[]
  sensores: SensorResumen[]
  onClose: () => void
  onSave: (data: SensorRequest) => Promise<void>
}

const TIPOS = [
  { value: 'NPK', label: 'NPK (nutrientes)' },
  { value: 'TEMP_HUM', label: 'Temperatura y humedad' },
  { value: 'PH', label: 'pH' },
  { value: 'CONDUCTIVIDAD', label: 'Conductividad' },
  { value: 'OTRO', label: 'Otro' },
]

const emptyForm = (): SensorRequest => ({
  pilaId: '',
  codigo: '',
  tipo: '',
  descripcion: '',
  activo: true,
})

function parseApiError(err: unknown): string {
  if (!(err instanceof Error)) return 'No se pudo guardar.'
  try {
    const parsed = JSON.parse(err.message) as { error?: string }
    if (parsed.error) return parsed.error
  } catch {
    /* not JSON */
  }
  return err.message || 'No se pudo guardar.'
}

export default function SensorModal({
  open,
  sensor,
  pilas,
  sensores,
  onClose,
  onSave,
}: SensorModalProps) {
  const [form, setForm] = useState<SensorRequest>(emptyForm())
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const pilasOcupadas = useMemo(
    () => new Set(sensores.filter((s) => s.id !== sensor?.id).map((s) => s.pilaId)),
    [sensores, sensor?.id],
  )

  const pilasDisponibles = useMemo(
    () => pilas.filter((p) => !pilasOcupadas.has(p.id)),
    [pilas, pilasOcupadas],
  )

  useEffect(() => {
    if (!open) return
    if (sensor) {
      setForm({
        pilaId: sensor.pilaId,
        codigo: sensor.codigo,
        tipo: sensor.tipo,
        descripcion: sensor.descripcion ?? '',
        activo: sensor.activo,
      })
    } else {
      setForm({
        ...emptyForm(),
        pilaId: pilasDisponibles[0]?.id ?? '',
      })
    }
    setError('')
  }, [open, sensor, pilasDisponibles])

  if (!open) return null

  const pilaOptions = sensor
    ? pilas.filter((p) => p.id === sensor.pilaId || !pilasOcupadas.has(p.id))
    : pilasDisponibles

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.pilaId) {
      setError('Seleccioná una pila.')
      return
    }
    if (!form.codigo.trim()) {
      setError('El código es obligatorio.')
      return
    }
    if (!form.tipo.trim()) {
      setError('El tipo es obligatorio.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload: SensorRequest = {
        pilaId: form.pilaId,
        codigo: form.codigo.trim(),
        tipo: form.tipo.trim(),
        descripcion: form.descripcion?.trim() || undefined,
        activo: form.activo,
      }
      await onSave(payload)
      onClose()
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{sensor ? 'Editar sensor' : 'Nuevo sensor'}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <form className={styles.formShell} onSubmit={handleSubmit}>
          <div className={styles.formBody}>
            <div className={styles.form}>
              {error && <div className={styles.error}>{error}</div>}

          {!sensor && pilasDisponibles.length === 0 && (
            <div className={styles.error}>
              Todas las pilas ya tienen un sensor asignado.
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="sensor-pila">pila</label>
            <select
              id="sensor-pila"
              className={styles.select}
              value={form.pilaId}
              onChange={(e) => setForm({ ...form, pilaId: e.target.value })}
              required
              disabled={pilaOptions.length === 0}
            >
              <option value="">Seleccionar pila…</option>
              {pilaOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="sensor-codigo">código</label>
            <input
              id="sensor-codigo"
              className={styles.input}
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="sensor-tipo">tipo</label>
            <select
              id="sensor-tipo"
              className={styles.select}
              value={TIPOS.some((t) => t.value === form.tipo) ? form.tipo : 'OTRO'}
              onChange={(e) => {
                const val = e.target.value
                setForm({ ...form, tipo: val === 'OTRO' ? '' : val })
              }}
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {(form.tipo === '' || !TIPOS.some((t) => t.value === form.tipo && t.value !== 'OTRO')) && (
              <input
                className={styles.input}
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                required
                style={{ marginTop: '0.4rem' }}
              />
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="sensor-descripcion">notas</label>
            <textarea
              id="sensor-descripcion"
              className={styles.textarea}
              value={form.descripcion ?? ''}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="sensor-activo">estado</label>
            <select
              id="sensor-activo"
              className={styles.select}
              value={form.activo ? 'true' : 'false'}
              onChange={(e) => setForm({ ...form, activo: e.target.value === 'true' })}
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </div>
            </div>
          </div>

          <div className={styles.formFooter}>
            <div className={styles.actions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>
                cancelar
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={saving || (!sensor && pilasDisponibles.length === 0)}
              >
                {saving ? 'guardando…' : 'guardar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
