import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Clock } from 'lucide-react'
import CertificadoModal from './CertificadoModal'
import { useDialog } from '../context/DialogContext'
import { emitirCertificado } from '../lib/certificados'
import { getPilaFases } from '../lib/fases'
import { getPila } from '../lib/pilas'
import type { PilaFases } from '../types/fases'
import type { Pila } from '../types/pila'
import styles from './CertificacionEvaluacion.module.css'

const FASES_META = [
  {
    key: 'mesofila' as const,
    nombre: 'Mesófila',
    rango: 'Amb. → 45°C',
    detalle: (f: PilaFases) =>
      f.fases.mesofila.temperaturaMax != null
        ? `Temp max: ${f.fases.mesofila.temperaturaMax}°C`
        : 'Sin lecturas de temperatura',
  },
  {
    key: 'termofila' as const,
    nombre: 'Termófila',
    rango: '45°C → 75°C',
    detalle: (f: PilaFases) =>
      f.fases.termofila.diasSobre55 != null
        ? `${f.fases.termofila.diasSobre55} días >55°C (Res. 29/2017)`
        : 'Sin días consecutivos >55°C',
  },
  {
    key: 'enfriamiento' as const,
    nombre: 'Enfriamiento',
    rango: '40°C → Amb.',
    detalle: (f: PilaFases) =>
      f.fases.enfriamiento.temperaturaActual != null
        ? `Temp actual: ${f.fases.enfriamiento.temperaturaActual}°C`
        : 'Sin lecturas recientes',
  },
  {
    key: 'maduracion' as const,
    nombre: 'Maduración',
    rango: (f: PilaFases) => `${f.diasEstimados} días`,
    detalle: (f: PilaFases) =>
      f.fases.maduracion.completada
        ? 'Período completado'
        : f.fases.maduracion.diasRestantes != null
          ? `Faltan ${f.fases.maduracion.diasRestantes}d`
          : '—',
  },
]

type CertificacionEvaluacionProps = {
  pilaId: string
  onCertificadoEmitido?: () => void
}

export default function CertificacionEvaluacion({
  pilaId,
  onCertificadoEmitido,
}: CertificacionEvaluacionProps) {
  const dialog = useDialog()
  const [pila, setPila] = useState<Pila | null>(null)
  const [fases, setFases] = useState<PilaFases | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [certModalOpen, setCertModalOpen] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [pilaData, fasesData] = await Promise.all([
        getPila(pilaId),
        getPilaFases(pilaId),
      ])
      setPila(pilaData)
      setFases(fasesData)
    } catch (err) {
      setPila(null)
      setFases(null)
      setError(err instanceof Error ? err.message : 'No se pudo cargar la evaluación.')
    } finally {
      setLoading(false)
    }
  }, [pilaId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const progresoPct = useMemo(() => {
    if (!fases || !fases.diasEstimados) return 0
    return Math.min(
      100,
      Math.round((fases.diasTranscurridos / fases.diasEstimados) * 100),
    )
  }, [fases])

  const handleEmitirCertificado = async (observaciones?: string) => {
    await emitirCertificado(pilaId, observaciones ? { observaciones } : {})
    await dialog.alert('Certificado emitido.')
    await loadData()
    onCertificadoEmitido?.()
  }

  if (loading) {
    return <div className={styles.loading}>evaluando fases…</div>
  }

  if (error || !pila || !fases) {
    return <div className={styles.error}>{error || 'No se pudo cargar la evaluación.'}</div>
  }

  return (
    <div className={styles.panel}>
      <div className={styles.pilaHeader}>
        <div className={styles.pilaNombre}>{pila.nombre}</div>
        <p className={styles.pilaMeta}>
          {fases.diasTranscurridos} / {fases.diasEstimados} días · Resolución N°29/2017
        </p>
      </div>

      <div className={styles.block}>
        <h3 className={styles.blockTitle}>Progreso del proceso</h3>
        <div className={styles.progressMeta}>
          <span>
            {fases.diasTranscurridos} / {fases.diasEstimados} días
          </span>
          <span>{progresoPct}%</span>
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progresoPct}%` }} />
        </div>
      </div>

      <div className={styles.block}>
        <h3 className={styles.blockTitle}>Fases del compostaje</h3>
        <div className={styles.fasesGrid}>
          {FASES_META.map((meta) => {
            const fase = fases.fases[meta.key]
            const rango = typeof meta.rango === 'function' ? meta.rango(fases) : meta.rango
            return (
              <article
                key={meta.key}
                className={`${styles.faseCard} ${fase.completada ? styles.faseCardDone : ''}`}
              >
                <div className={styles.faseHeader}>
                  {fase.completada ? (
                    <Check size={18} strokeWidth={2} className={styles.faseIconDone} />
                  ) : (
                    <Clock size={18} strokeWidth={1.5} className={styles.faseIconPending} />
                  )}
                  <span className={styles.faseName}>{meta.nombre}</span>
                </div>
                <span className={styles.faseRange}>{rango}</span>
                <span
                  className={`${styles.faseEstado} ${fase.completada ? styles.estadoDone : styles.estadoPending}`}
                >
                  {fase.completada ? 'Completada' : 'Pendiente'}
                </span>
                <span className={styles.faseDetail}>{meta.detalle(fases)}</span>
                <span className={styles.faseCriterio}>{fase.descripcion}</span>
              </article>
            )
          })}
        </div>
      </div>

      <div className={styles.footer}>
        {fases.aptoParaCertificar ? (
          <p className={styles.mensajeOk}>
            El compost cumple con la Resolución N°29/2017 y está listo para certificar
          </p>
        ) : (
          <p className={styles.mensajeError}>
            {fases.motivoNoCertificable ?? 'El compost aún no cumple todos los requisitos.'}
          </p>
        )}
        <button
          type="button"
          className={`${styles.emitBtn} ${fases.aptoParaCertificar ? styles.emitBtnEnabled : styles.emitBtnDisabled}`}
          disabled={!fases.aptoParaCertificar}
          onClick={() => setCertModalOpen(true)}
        >
          emitir certificado
        </button>
      </div>

      <CertificadoModal
        open={certModalOpen}
        pilaNombre={pila.nombre}
        onClose={() => setCertModalOpen(false)}
        onConfirm={handleEmitirCertificado}
      />
    </div>
  )
}
