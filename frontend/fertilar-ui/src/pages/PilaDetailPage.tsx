import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ExternalLink, Trash2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import CertificadoModal from '../components/CertificadoModal'
import { useDialog } from '../context/DialogContext'
import {
  deleteCertificado,
  emitirCertificado,
  listCertificadosPorPila,
} from '../lib/certificados'
import { listLecturasPorPila } from '../lib/lecturas'
import { getPila, updatePila } from '../lib/pilas'
import { getCurrentUsuario } from '../lib/usuarios'
import type { Certificado } from '../types/certificado'
import type { Lectura } from '../types/lectura'
import type { Pila, PilaEstado, PilaRequest } from '../types/pila'
import type { UsuarioRol } from '../types/usuario'
import styles from './PilaDetailPage.module.css'

const ESTADO_LABEL: Record<PilaEstado, string> = {
  ACTIVA: 'activa',
  PAUSADA: 'en pausa',
  FINALIZADA: 'finalizada',
}

const DEFAULT_DIAS = 90
const DEFAULT_HUMEDAD = 43
const DEFAULT_TEMP = 30

function formatDate(date: string): string {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function daysBetween(from: string, to: Date): number {
  const start = new Date(`${from}T12:00:00`)
  const diff = to.getTime() - start.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

function isNearTarget(actual: number, target: number): boolean {
  const tolerance = Math.max(3, target * 0.1)
  return Math.abs(actual - target) <= tolerance
}

function canEmitirCertificado(rol: UsuarioRol | null): boolean {
  return rol === 'ADMIN' || rol === 'ENCARGADO'
}

function motivoNoEmitir(
  estado: PilaEstado,
  rol: UsuarioRol | null,
  tieneLecturas: boolean,
): string | null {
  if (estado !== 'FINALIZADA') return null
  if (!canEmitirCertificado(rol)) {
    if (rol == null) {
      return 'No pudimos verificar tu rol. Recargá la página o pedile a un administrador que te asigne permisos.'
    }
    return 'Solo usuarios admin o encargado pueden emitir certificados.'
  }
  if (!tieneLecturas) {
    return 'La pila no tiene lecturas registradas. Cargá al menos una lectura del sensor antes de emitir.'
  }
  return null
}

function getLatestLectura(lecturas: Lectura[]): Lectura | null {
  if (lecturas.length === 0) return null
  return [...lecturas].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )[0]
}

export default function PilaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const dialog = useDialog()

  const [pila, setPila] = useState<Pila | null>(null)
  const [certificados, setCertificados] = useState<Certificado[]>([])
  const [ultimaLectura, setUltimaLectura] = useState<Lectura | null>(null)
  const [rol, setRol] = useState<UsuarioRol | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingConfig, setSavingConfig] = useState(false)
  const [finalizando, setFinalizando] = useState(false)
  const [certModalOpen, setCertModalOpen] = useState(false)

  const [diasEstimados, setDiasEstimados] = useState(DEFAULT_DIAS)
  const [humedadObjetivo, setHumedadObjetivo] = useState(String(DEFAULT_HUMEDAD))
  const [temperaturaObjetivo, setTemperaturaObjetivo] = useState(String(DEFAULT_TEMP))

  const loadData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const [pilaData, certs, lecturas, perfil] = await Promise.all([
        getPila(id),
        listCertificadosPorPila(id),
        listLecturasPorPila(id),
        getCurrentUsuario().catch(() => null),
      ])
      setPila(pilaData)
      setCertificados(certs)
      setUltimaLectura(getLatestLectura(lecturas))
      setRol(perfil?.rol ?? null)
      setDiasEstimados(pilaData.diasEstimados ?? DEFAULT_DIAS)
      setHumedadObjetivo(String(pilaData.humedadObjetivo ?? DEFAULT_HUMEDAD))
      setTemperaturaObjetivo(String(pilaData.temperaturaObjetivo ?? DEFAULT_TEMP))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la pila.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const fechaEstimadaFin = useMemo(() => {
    if (!pila) return null
    return addDays(pila.fechaInicio, diasEstimados)
  }, [pila, diasEstimados])

  const progreso = useMemo(() => {
    if (!pila || !diasEstimados) return { dias: 0, pct: 0 }
    const endDate = pila.estado === 'FINALIZADA' && pila.fechaFin
      ? new Date(`${pila.fechaFin}T12:00:00`)
      : new Date()
    const dias = daysBetween(pila.fechaInicio, endDate)
    const pct = Math.min(100, Math.round((dias / diasEstimados) * 100))
    return { dias, pct }
  }, [pila, diasEstimados])

  const fechaEstimadaPasada = useMemo(() => {
    if (!fechaEstimadaFin) return false
    const hoy = new Date().toISOString().slice(0, 10)
    return hoy >= fechaEstimadaFin
  }, [fechaEstimadaFin])

  const indicadores = useMemo(() => {
    const humTarget = Number(humedadObjetivo)
    const tempTarget = Number(temperaturaObjetivo)
    const humActual = ultimaLectura?.humedad
    const tempActual = ultimaLectura?.temperatura

    return {
      humedad:
        humActual != null && !Number.isNaN(humTarget)
          ? isNearTarget(humActual, humTarget)
          : null,
      temperatura:
        tempActual != null && !Number.isNaN(tempTarget)
          ? isNearTarget(tempActual, tempTarget)
          : null,
      humActual,
      tempActual,
    }
  }, [ultimaLectura, humedadObjetivo, temperaturaObjetivo])

  const buildRequest = (overrides: Partial<PilaRequest> = {}): PilaRequest => {
    if (!pila) throw new Error('Pila no cargada')
    return {
      nombre: pila.nombre,
      descripcion: pila.descripcion ?? undefined,
      ubicacion: pila.ubicacion ?? undefined,
      fechaInicio: pila.fechaInicio,
      fechaFin: pila.fechaFin ?? undefined,
      diasEstimados,
      humedadObjetivo: Number(humedadObjetivo),
      temperaturaObjetivo: Number(temperaturaObjetivo),
      estado: pila.estado,
      ...overrides,
    }
  }

  const handleSaveConfig = async () => {
    if (!pila || !id) return
    const hum = Number(humedadObjetivo)
    const temp = Number(temperaturaObjetivo)
    if (!diasEstimados || diasEstimados < 1) {
      await dialog.error('Los días estimados deben ser al menos 1.')
      return
    }
    if (Number.isNaN(hum) || Number.isNaN(temp)) {
      await dialog.error('Revisá los valores de humedad y temperatura objetivo.')
      return
    }

    setSavingConfig(true)
    try {
      const updated = await updatePila(id, buildRequest())
      setPila(updated)
      await dialog.alert('Configuración guardada.')
    } catch (err) {
      await dialog.error(err instanceof Error ? err.message : 'No se pudo guardar.')
    } finally {
      setSavingConfig(false)
    }
  }

  const handleFinalizar = async () => {
    if (!pila || !id) return
    const msg = fechaEstimadaPasada
      ? '¿Finalizar esta pila? Ya pasó la fecha estimada de finalización.'
      : '¿Finalizar esta pila antes de la fecha estimada?'
    const ok = await dialog.confirm(msg, 'finalizar pila', {
      confirmLabel: 'finalizar',
    })
    if (!ok) return

    setFinalizando(true)
    try {
      const hoy = new Date().toISOString().slice(0, 10)
      const updated = await updatePila(
        id,
        buildRequest({ estado: 'FINALIZADA', fechaFin: hoy }),
      )
      setPila(updated)

      const bloqueo = motivoNoEmitir(updated.estado, rol, ultimaLectura != null)
      if (bloqueo) {
        await dialog.alert(`Pila finalizada.\n\n${bloqueo}`)
        return
      }

      const emitir = await dialog.confirm(
        'La pila quedó finalizada. ¿Querés emitir el certificado ahora?',
        'emitir certificado',
        { confirmLabel: 'emitir' },
      )
      if (emitir) {
        setCertModalOpen(true)
      } else {
        await dialog.alert(
          'Pila finalizada. Podés emitir el certificado cuando quieras con el botón de abajo.',
        )
      }
    } catch (err) {
      await dialog.error(err instanceof Error ? err.message : 'No se pudo finalizar.')
    } finally {
      setFinalizando(false)
    }
  }

  const handleEmitirCertificado = async (observaciones?: string) => {
    if (!id) return
    await emitirCertificado(id, observaciones ? { observaciones } : {})
    const certs = await listCertificadosPorPila(id)
    setCertificados(certs)
    await dialog.alert('Certificado emitido.')
  }

  const handleDeleteCertificado = async (cert: Certificado) => {
    const ok = await dialog.confirm(
      `¿Eliminar el certificado ${cert.numero}?`,
      'eliminar certificado',
      { destructive: true, confirmLabel: 'eliminar' },
    )
    if (!ok) return
    try {
      await deleteCertificado(cert.id)
      setCertificados((prev) => prev.filter((c) => c.id !== cert.id))
    } catch (err) {
      await dialog.error(err instanceof Error ? err.message : 'No se pudo eliminar.')
    }
  }

  if (loading) {
    return <div className={styles.page}><div className={styles.loading}>cargando…</div></div>
  }

  if (error || !pila || !id) {
    return (
      <div className={styles.page}>
        <Link to="/pilas" className={styles.backLink}>
          <ArrowLeft size={16} strokeWidth={1.5} />
          volver a pilas
        </Link>
        <div className={styles.error}>{error || 'Pila no encontrada.'}</div>
      </div>
    )
  }

  const puedeEmitir =
    pila.estado === 'FINALIZADA' &&
    canEmitirCertificado(rol) &&
    ultimaLectura != null
  const avisoEmitir = motivoNoEmitir(pila.estado, rol, ultimaLectura != null)

  return (
    <div className={styles.page}>
      <Link to="/pilas" className={styles.backLink}>
        <ArrowLeft size={16} strokeWidth={1.5} />
        volver a pilas
      </Link>

      <header className={styles.header}>
        <div>
          <h1 className={styles.heading}>{pila.nombre}</h1>
          <p className={styles.sub}>
            {pila.ubicacion ?? 'sin ubicación'} · inicio {formatDate(pila.fechaInicio)}
          </p>
        </div>
        <span
          className={`${styles.status} ${pila.estado === 'PAUSADA' ? styles.statusPausa : ''} ${pila.estado === 'FINALIZADA' ? styles.statusFinal : ''}`}
        >
          {ESTADO_LABEL[pila.estado]}
        </span>
      </header>

      {pila.descripcion && (
        <p className={styles.descripcion}>{pila.descripcion}</p>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>configuración del proceso</h2>
        <div className={styles.configGrid}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="dias-estimados">días estimados</label>
            <input
              id="dias-estimados"
              type="number"
              min={1}
              className={styles.input}
              value={diasEstimados}
              disabled={pila.estado === 'FINALIZADA'}
              onChange={(e) => setDiasEstimados(Number(e.target.value))}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="humedad-obj">humedad objetivo (%)</label>
            <input
              id="humedad-obj"
              type="number"
              step="0.1"
              className={styles.input}
              value={humedadObjetivo}
              disabled={pila.estado === 'FINALIZADA'}
              onChange={(e) => setHumedadObjetivo(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="temp-obj">temperatura objetivo (°C)</label>
            <input
              id="temp-obj"
              type="number"
              step="0.1"
              className={styles.input}
              value={temperaturaObjetivo}
              disabled={pila.estado === 'FINALIZADA'}
              onChange={(e) => setTemperaturaObjetivo(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>fecha estimada de finalización</span>
            <div className={styles.readonlyValue}>
              {fechaEstimadaFin ? formatDate(fechaEstimadaFin) : '—'}
            </div>
          </div>
        </div>
        {pila.estado !== 'FINALIZADA' && (
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={handleSaveConfig}
            disabled={savingConfig}
          >
            {savingConfig ? 'guardando…' : 'guardar configuración'}
          </button>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>progreso del proceso</h2>
        <div className={styles.progressMeta}>
          <span>{progreso.dias} / {diasEstimados} días</span>
          <span>{progreso.pct}%</span>
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progreso.pct}%` }} />
        </div>

        <div className={styles.indicators}>
          <div className={styles.indicator}>
            <span className={styles.indicatorLabel}>humedad actual</span>
            <span className={styles.indicatorValue}>
              {indicadores.humActual != null ? `${indicadores.humActual}%` : 'sin lectura'}
            </span>
            {indicadores.humedad != null && (
              <span className={indicadores.humedad ? styles.dotOk : styles.dotBad} />
            )}
          </div>
          <div className={styles.indicator}>
            <span className={styles.indicatorLabel}>temperatura actual</span>
            <span className={styles.indicatorValue}>
              {indicadores.tempActual != null ? `${indicadores.tempActual}°C` : 'sin lectura'}
            </span>
            {indicadores.temperatura != null && (
              <span className={indicadores.temperatura ? styles.dotOk : styles.dotBad} />
            )}
          </div>
        </div>
        <p className={styles.indicatorHint}>
          Verde: cerca del objetivo · Rojo: fuera de rango
        </p>
      </section>

      <div className={styles.actions}>
        {pila.estado === 'ACTIVA' && (
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={handleFinalizar}
            disabled={finalizando}
          >
            {finalizando ? 'finalizando…' : 'finalizar pila'}
          </button>
        )}
        {pila.estado === 'FINALIZADA' && avisoEmitir && (
          <p className={styles.emitNotice}>{avisoEmitir}</p>
        )}
        {puedeEmitir && (
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => setCertModalOpen(true)}
          >
            emitir certificado
          </button>
        )}
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>certificados emitidos</h2>
        {certificados.length === 0 ? (
          <p className={styles.emptyCerts}>Todavía no hay certificados para esta pila.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>número</th>
                  <th>fecha emisión</th>
                  <th>emitido por</th>
                  <th>acciones</th>
                </tr>
              </thead>
              <tbody>
                {certificados.map((cert) => (
                  <tr key={cert.id}>
                    <td>{cert.numero}</td>
                    <td>{formatDate(cert.fechaEmision)}</td>
                    <td>{cert.usuarioNombre.trim() || '—'}</td>
                    <td>
                      <div className={styles.tableActions}>
                        <a
                          href={cert.urlDocumento}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.tableBtn}
                          aria-label={`Ver ${cert.numero}`}
                        >
                          <ExternalLink size={14} strokeWidth={1.5} />
                          ver
                        </a>
                        {canEmitirCertificado(rol) && (
                          <button
                            type="button"
                            className={`${styles.tableBtn} ${styles.tableBtnDanger}`}
                            onClick={() => handleDeleteCertificado(cert)}
                            aria-label={`Eliminar ${cert.numero}`}
                          >
                            <Trash2 size={14} strokeWidth={1.5} />
                            eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <CertificadoModal
        open={certModalOpen}
        pilaNombre={pila.nombre}
        onClose={() => setCertModalOpen(false)}
        onConfirm={handleEmitirCertificado}
      />
    </div>
  )
}
