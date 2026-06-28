import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { LecturaRequest } from '../types/lectura'
import type { SensorResumen } from '../types/sensor'
import styles from './PilaModal.module.css'

type LecturaModalProps = {
  open: boolean
  sensores: SensorResumen[]
  onClose: () => void
  onSave: (data: LecturaRequest) => Promise<void>
}

type FormState = {
  sensorId: string
  temperatura: string
  humedad: string
  nitrogeno: string
  fosforo: string
  potasio: string
  ph: string
  conductividad: string
  oxigeno: string
}

const emptyForm = (sensorId = ''): FormState => ({
  sensorId,
  temperatura: '',
  humedad: '',
  nitrogeno: '',
  fosforo: '',
  potasio: '',
  ph: '',
  conductividad: '',
  oxigeno: '',
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

function toOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : undefined
}

export default function LecturaModal({
  open,
  sensores,
  onClose,
  onSave,
}: LecturaModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm())
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(emptyForm(sensores[0]?.id ?? ''))
    setError('')
  }, [open, sensores])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.sensorId) {
      setError('Seleccioná un sensor.')
      return
    }

    const hasValue = [
      form.temperatura,
      form.humedad,
      form.nitrogeno,
      form.fosforo,
      form.potasio,
      form.ph,
      form.conductividad,
      form.oxigeno,
    ].some((v) => v.trim() !== '')

    if (!hasValue) {
      setError('Ingresá al menos un valor de medición.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload: LecturaRequest = {
        sensorId: form.sensorId,
        temperatura: toOptionalNumber(form.temperatura),
        humedad: toOptionalNumber(form.humedad),
        nitrogeno: toOptionalNumber(form.nitrogeno),
        fosforo: toOptionalNumber(form.fosforo),
        potasio: toOptionalNumber(form.potasio),
        ph: toOptionalNumber(form.ph),
        conductividad: toOptionalNumber(form.conductividad),
        oxigeno: toOptionalNumber(form.oxigeno),
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
          <h2 className={styles.title}>Nueva lectura</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <form className={styles.formShell} onSubmit={handleSubmit}>
          <div className={styles.formBody}>
            <div className={styles.form}>
              {error && <div className={styles.error}>{error}</div>}

          {sensores.length === 0 && (
            <div className={styles.error}>
              Primero necesitás al menos un sensor registrado.
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="lectura-sensor">sensor</label>
            <select
              id="lectura-sensor"
              className={styles.select}
              value={form.sensorId}
              onChange={(e) => setForm({ ...form, sensorId: e.target.value })}
              required
              disabled={sensores.length === 0}
            >
              <option value="">Seleccionar sensor…</option>
              {sensores.map((s) => (
                <option key={s.id} value={s.id}>{s.codigo} · {s.tipo}</option>
              ))}
            </select>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="lectura-temp">temperatura (°C)</label>
              <input
                id="lectura-temp"
                type="number"
                step="0.01"
                className={styles.input}
                value={form.temperatura}
                onChange={(e) => setForm({ ...form, temperatura: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="lectura-hum">humedad (%)</label>
              <input
                id="lectura-hum"
                type="number"
                step="0.01"
                className={styles.input}
                value={form.humedad}
                onChange={(e) => setForm({ ...form, humedad: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="lectura-n">nitrógeno</label>
              <input
                id="lectura-n"
                type="number"
                step="0.01"
                className={styles.input}
                value={form.nitrogeno}
                onChange={(e) => setForm({ ...form, nitrogeno: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="lectura-p">fósforo</label>
              <input
                id="lectura-p"
                type="number"
                step="0.01"
                className={styles.input}
                value={form.fosforo}
                onChange={(e) => setForm({ ...form, fosforo: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="lectura-k">potasio</label>
              <input
                id="lectura-k"
                type="number"
                step="0.01"
                className={styles.input}
                value={form.potasio}
                onChange={(e) => setForm({ ...form, potasio: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="lectura-ph">pH</label>
              <input
                id="lectura-ph"
                type="number"
                step="0.01"
                className={styles.input}
                value={form.ph}
                onChange={(e) => setForm({ ...form, ph: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="lectura-cond">conductividad</label>
              <input
                id="lectura-cond"
                type="number"
                step="0.01"
                className={styles.input}
                value={form.conductividad}
                onChange={(e) => setForm({ ...form, conductividad: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="lectura-o2">oxígeno (%)</label>
              <input
                id="lectura-o2"
                type="number"
                step="0.01"
                className={styles.input}
                value={form.oxigeno}
                onChange={(e) => setForm({ ...form, oxigeno: e.target.value })}
              />
            </div>
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
                disabled={saving || sensores.length === 0}
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
