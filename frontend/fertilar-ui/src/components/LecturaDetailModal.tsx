import { X } from 'lucide-react'
import type { Lectura } from '../types/lectura'
import type { SensorResumen } from '../types/sensor'
import styles from './PilaModal.module.css'

type LecturaDetailModalProps = {
  open: boolean
  lectura: Lectura | null
  sensor?: SensorResumen
  onClose: () => void
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatValue(value: number | null | undefined, unit = ''): string {
  if (value === null || value === undefined) return '—'
  return `${value}${unit}`
}

export default function LecturaDetailModal({
  open,
  lectura,
  sensor,
  onClose,
}: LecturaDetailModalProps) {
  if (!open || !lectura) return null

  const fields = [
    { label: 'temperatura', value: formatValue(lectura.temperatura, ' °C') },
    { label: 'humedad', value: formatValue(lectura.humedad, ' %') },
    { label: 'nitrógeno', value: formatValue(lectura.nitrogeno) },
    { label: 'fósforo', value: formatValue(lectura.fosforo) },
    { label: 'potasio', value: formatValue(lectura.potasio) },
    { label: 'pH', value: formatValue(lectura.ph) },
    { label: 'conductividad', value: formatValue(lectura.conductividad) },
  ]

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>detalle de lectura</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className={styles.formShell}>
          <div className={styles.formBody}>
            <div className={styles.form}>
              <div className={styles.field}>
                <span className={styles.label}>sensor</span>
                <span className={styles.input}>
                  {sensor ? `${sensor.codigo} · ${sensor.tipo}` : 'sensor desconocido'}
                </span>
              </div>

              <div className={styles.field}>
                <span className={styles.label}>fecha</span>
                <span className={styles.input}>{formatDateTime(lectura.timestamp)}</span>
              </div>

              {fields.map((f) => (
                <div key={f.label} className={styles.field}>
                  <span className={styles.label}>{f.label}</span>
                  <span className={styles.input}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.formFooter}>
            <div className={styles.actions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>
                cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
