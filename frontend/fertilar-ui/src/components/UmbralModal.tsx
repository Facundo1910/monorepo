import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { Umbral, UmbralNivel, UmbralParametro, UmbralRequest } from '../types/umbral'
import styles from './PilaModal.module.css'

type UmbralModalProps = {
  open: boolean
  umbral?: Umbral | null
  onClose: () => void
  onSave: (data: UmbralRequest) => Promise<void>
}

const PARAMETROS: { value: UmbralParametro; label: string; unit: string }[] = [
  { value: 'TEMPERATURA', label: 'Temperatura', unit: '°C' },
  { value: 'HUMEDAD', label: 'Humedad', unit: '%' },
  { value: 'PH', label: 'pH', unit: '' },
  { value: 'CONDUCTIVIDAD', label: 'Conductividad', unit: '' },
  { value: 'NITROGENO', label: 'Nitrógeno', unit: '' },
  { value: 'FOSFORO', label: 'Fósforo', unit: '' },
  { value: 'POTASIO', label: 'Potasio', unit: '' },
]

const NIVELES: { value: UmbralNivel; label: string }[] = [
  { value: 'INFO', label: 'Info' },
  { value: 'ADVERTENCIA', label: 'Advertencia' },
  { value: 'CRITICA', label: 'Crítica' },
]

type FormState = {
  parametro: UmbralParametro
  valorMin: string
  valorMax: string
  nivel: UmbralNivel
  activo: boolean
}

const emptyForm = (): FormState => ({
  parametro: 'TEMPERATURA',
  valorMin: '',
  valorMax: '',
  nivel: 'ADVERTENCIA',
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

function toOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : undefined
}

export default function UmbralModal({
  open,
  umbral,
  onClose,
  onSave,
}: UmbralModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm())
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (umbral) {
      setForm({
        parametro: umbral.parametro,
        valorMin: umbral.valorMin != null ? String(umbral.valorMin) : '',
        valorMax: umbral.valorMax != null ? String(umbral.valorMax) : '',
        nivel: umbral.nivel,
        activo: umbral.activo,
      })
    } else {
      setForm(emptyForm())
    }
    setError('')
  }, [open, umbral])

  if (!open) return null

  const selectedParam = PARAMETROS.find((p) => p.value === form.parametro)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const valorMin = toOptionalNumber(form.valorMin)
    const valorMax = toOptionalNumber(form.valorMax)

    if (valorMin === undefined && valorMax === undefined) {
      setError('Indicá al menos un valor mínimo o máximo.')
      return
    }
    if (valorMin !== undefined && valorMax !== undefined && valorMin > valorMax) {
      setError('El mínimo no puede ser mayor que el máximo.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload: UmbralRequest = {
        parametro: form.parametro,
        valorMin,
        valorMax,
        nivel: form.nivel,
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
          <h2 className={styles.title}>{umbral ? 'editar umbral' : 'nuevo umbral'}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <form className={styles.formShell} onSubmit={handleSubmit}>
          <div className={styles.formBody}>
            <div className={styles.form}>
              {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="umbral-parametro">parámetro</label>
            <select
              id="umbral-parametro"
              className={styles.select}
              value={form.parametro}
              onChange={(e) => setForm({ ...form, parametro: e.target.value as UmbralParametro })}
              required
            >
              {PARAMETROS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="umbral-min">
                mínimo{selectedParam?.unit ? ` (${selectedParam.unit})` : ''}
              </label>
              <input
                id="umbral-min"
                type="number"
                step="0.01"
                className={styles.input}
                value={form.valorMin}
                onChange={(e) => setForm({ ...form, valorMin: e.target.value })}
                placeholder="Opcional"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="umbral-max">
                máximo{selectedParam?.unit ? ` (${selectedParam.unit})` : ''}
              </label>
              <input
                id="umbral-max"
                type="number"
                step="0.01"
                className={styles.input}
                value={form.valorMax}
                onChange={(e) => setForm({ ...form, valorMax: e.target.value })}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="umbral-nivel">nivel de alerta</label>
            <select
              id="umbral-nivel"
              className={styles.select}
              value={form.nivel}
              onChange={(e) => setForm({ ...form, nivel: e.target.value as UmbralNivel })}
              required
            >
              {NIVELES.map((n) => (
                <option key={n.value} value={n.value}>{n.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="umbral-activo">estado</label>
            <select
              id="umbral-activo"
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

export { PARAMETROS }
