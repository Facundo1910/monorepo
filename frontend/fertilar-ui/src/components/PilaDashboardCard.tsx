import { useMemo, useState, type ReactNode } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Alerta } from '../types/alerta'
import type { Lectura } from '../types/lectura'
import type { Pila } from '../types/pila'
import styles from './PilaDashboardCard.module.css'

const DEFAULT_DIAS = 90
const MAX_CHART_POINTS = 150

const METRIC_RANGES = {
  temperatura: { min: 45, max: 65, unit: '°C' },
  humedad: { min: 45, max: 60, unit: '%' },
  ph: { min: 5.8, max: 7.2, unit: '' },
  oxigeno: { min: 5, max: 20, unit: '%' },
} as const

type ChartView = 'ambiente' | 'npk'

type BasePoint = {
  time: string
  timestamp: number
}

type AmbientePoint = BasePoint & {
  temperatura: number | null
  humedad: number | null
  ph: number | null
  oxigeno: number | null
}

type NpkPoint = BasePoint & {
  nitrogeno: number | null
  fosforo: number | null
  potasio: number | null
  conductividad: number | null
}

type PilaDashboardCardProps = {
  pila: Pila
  lecturas: Lectura[]
  alertasPendientes: Alerta[]
}

const CHART_VIEWS: { id: ChartView; label: string }[] = [
  { id: 'ambiente', label: 'Temperatura · Humedad · pH' },
  { id: 'npk', label: 'N · P · K · Conductividad' },
]

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

function toNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function formatMetricValue(value: number | null, unit: string): string {
  return value != null ? `${value}${unit}` : '—'
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatChartLabel(iso: string, spanDays: number): string {
  const d = new Date(iso)
  if (spanDays > 14) {
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
  }
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function downsampleLecturas(lecturas: Lectura[], maxPoints: number): Lectura[] {
  if (lecturas.length <= maxPoints) {
    return [...lecturas].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )
  }
  const sorted = [...lecturas].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  )
  const result: Lectura[] = []
  for (let i = 0; i < maxPoints; i++) {
    const index = Math.round((i * (sorted.length - 1)) / (maxPoints - 1))
    result.push(sorted[index])
  }
  return result
}

function getLatestLectura(lecturas: Lectura[]): Lectura | null {
  if (lecturas.length === 0) return null
  return [...lecturas].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )[0]
}

function inRange(value: number | null, min: number, max: number): boolean {
  return value != null && value >= min && value <= max
}

function dateToMs(isoDate: string, endOfDay = false): number {
  return new Date(`${isoDate}T${endOfDay ? '23:59:59' : '00:00:00'}`).getTime()
}

function buildAmbienteData(lecturas: Lectura[]): AmbientePoint[] {
  return downsampleLecturas(lecturas, MAX_CHART_POINTS).map((l) => ({
    time: l.timestamp,
    timestamp: new Date(l.timestamp).getTime(),
    temperatura: toNumber(l.temperatura),
    humedad: toNumber(l.humedad),
    ph: toNumber(l.ph),
    oxigeno: toNumber(l.oxigeno),
  }))
}

function buildNpkData(lecturas: Lectura[]): NpkPoint[] {
  return downsampleLecturas(lecturas, MAX_CHART_POINTS).map((l) => ({
    time: l.timestamp,
    timestamp: new Date(l.timestamp).getTime(),
    nitrogeno: toNumber(l.nitrogeno),
    fosforo: toNumber(l.fosforo),
    potasio: toNumber(l.potasio),
    conductividad: toNumber(l.conductividad),
  }))
}



function ChartTooltip({
  active,
  payload,
  labels,
  units,
}: {
  active?: boolean
  payload?: Array<{ dataKey: string; value: number | null; color: string; payload: BasePoint }>
  labels: Record<string, string>
  units: Record<string, string>
}) {
  if (!active || !payload?.length) return null

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTime}>{formatDateTime(payload[0].payload.time)}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {labels[entry.dataKey] ?? entry.dataKey}:{' '}
          {entry.value != null ? `${entry.value}${units[entry.dataKey] ?? ''}` : '—'}
        </p>
      ))}
    </div>
  )
}

function CycleChart({
  data,
  cycleStart,
  cycleEnd,
  hoy,
  showHoyMarker,
  diasEstimados,
  children,
}: {
  data: BasePoint[]
  cycleStart: number
  cycleEnd: number
  hoy: number
  showHoyMarker: boolean
  diasEstimados: number
  children: ReactNode
}) {
  if (data.length === 0) {
    return <p className={styles.noData}>Sin lecturas registradas en el proceso</p>
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,41,38,0.08)" />
        <XAxis
          dataKey="timestamp"
          type="number"
          scale="time"
          domain={[cycleStart, cycleEnd]}
          tick={{ fontSize: 10, fill: '#9a9690' }}
          tickLine={false}
          axisLine={false}
          minTickGap={48}
          tickFormatter={(ts) =>
            formatChartLabel(new Date(ts as number).toISOString(), diasEstimados)
          }
        />
        {showHoyMarker && (
          <ReferenceLine
            x={hoy}
            stroke="#9a9690"
            strokeDasharray="4 4"
            label={{ value: 'Hoy', position: 'insideTopRight', fill: '#9a9690', fontSize: 10 }}
          />
        )}
        {children}
      </LineChart>
    </ResponsiveContainer>
  )
}

export default function PilaDashboardCard({
  pila,
  lecturas,
  alertasPendientes,
}: PilaDashboardCardProps) {
  const [chartView, setChartView] = useState<ChartView>('ambiente')

  const diasEstimados = pila.diasEstimados ?? DEFAULT_DIAS
  const fechaEstimadaFin = pila.fechaEstimadaFin ?? addDays(pila.fechaInicio, diasEstimados)

  const progreso = useMemo(() => {
    const dias = daysBetween(pila.fechaInicio, new Date())
    const pct = Math.min(100, Math.round((dias / diasEstimados) * 100))
    return { dias, pct }
  }, [pila.fechaInicio, diasEstimados])

  const cycleStart = dateToMs(pila.fechaInicio)
  const cycleEnd = dateToMs(fechaEstimadaFin, true)
  const hoy = Date.now()
  const showHoyMarker = hoy > cycleStart && hoy < cycleEnd

  const ultimaLectura = useMemo(() => getLatestLectura(lecturas), [lecturas])
  const ambienteData = useMemo(() => buildAmbienteData(lecturas), [lecturas])
  const npkData = useMemo(() => buildNpkData(lecturas), [lecturas])
  const lecturasEnProceso = lecturas.length

  const ultimaTemp = toNumber(ultimaLectura?.temperatura)
  const ultimaHum = toNumber(ultimaLectura?.humedad)
  const ultimaPh = toNumber(ultimaLectura?.ph)
  const ultimaO2 = toNumber(ultimaLectura?.oxigeno)
  const ultimaN = toNumber(ultimaLectura?.nitrogeno)
  const ultimaP = toNumber(ultimaLectura?.fosforo)
  const ultimaK = toNumber(ultimaLectura?.potasio)
  const ultimaCond = toNumber(ultimaLectura?.conductividad)

  const currentViewIndex = CHART_VIEWS.findIndex((v) => v.id === chartView)
  const currentView = CHART_VIEWS[currentViewIndex]

  const goPrevChart = () => {
    const next = (currentViewIndex - 1 + CHART_VIEWS.length) % CHART_VIEWS.length
    setChartView(CHART_VIEWS[next].id)
  }

  const goNextChart = () => {
    const next = (currentViewIndex + 1) % CHART_VIEWS.length
    setChartView(CHART_VIEWS[next].id)
  }

  const pendientes = alertasPendientes.length

  const ambienteLabels = { temperatura: 'Temp.', humedad: 'Hum.', ph: 'pH', oxigeno: 'O₂' }
  const ambienteUnits = { temperatura: '°C', humedad: '%', ph: '', oxigeno: '%' }
  const npkLabels = {
    nitrogeno: 'N',
    fosforo: 'P',
    potasio: 'K',
    conductividad: 'Cond.',
  }
  const npkUnits = { nitrogeno: '', fosforo: '', potasio: '', conductividad: '' }

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h2 className={styles.name}>{pila.nombre}</h2>
          <span className={styles.badge}>activa</span>
        </div>
        <p className={styles.dates}>
          Inicio: {formatDate(pila.fechaInicio)} · Fin estimado:{' '}
          {formatDate(fechaEstimadaFin)} (día {progreso.dias}/{diasEstimados})
        </p>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progreso.pct}%` }} />
        </div>
        <p className={styles.progressLabel}>{progreso.pct}% del proceso</p>
      </header>

      <div className={styles.chartSection}>
        <div className={styles.chartNav}>
          <button
            type="button"
            className={styles.chartNavBtn}
            onClick={goPrevChart}
            aria-label="Gráfico anterior"
          >
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>
          <span className={styles.chartNavLabel}>{currentView.label}</span>
          <button
            type="button"
            className={styles.chartNavBtn}
            onClick={goNextChart}
            aria-label="Gráfico siguiente"
          >
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className={styles.chartWrap}>
          {chartView === 'ambiente' ? (
            <CycleChart
              data={ambienteData}
              cycleStart={cycleStart}
              cycleEnd={cycleEnd}
              hoy={hoy}
              showHoyMarker={showHoyMarker}
              diasEstimados={diasEstimados}
            >
              <YAxis
                yAxisId="temp"
                tick={{ fontSize: 11, fill: '#c0392b' }}
                tickLine={false}
                axisLine={false}
                width={36}
                domain={['auto', 'auto']}
              />
              <YAxis
                yAxisId="hum"
                orientation="right"
                tick={{ fontSize: 11, fill: '#2980b9' }}
                tickLine={false}
                axisLine={false}
                width={36}
                domain={[0, 100]}
              />
              <YAxis yAxisId="ph" domain={[5, 8]} hide />
              <YAxis yAxisId="o2" domain={[0, 25]} hide />
              <Tooltip
                content={
                  <ChartTooltip labels={ambienteLabels} units={ambienteUnits} />
                }
              />
              <Legend
                wrapperStyle={{ fontSize: '0.75rem', paddingTop: '0.5rem' }}
                formatter={(value) =>
                  value === 'temperatura'
                    ? 'Temperatura'
                    : value === 'humedad'
                      ? 'Humedad'
                      : value === 'oxigeno'
                        ? 'Oxígeno'
                        : 'pH'
                }
              />
              <Line
                yAxisId="temp"
                type="monotone"
                dataKey="temperatura"
                name="temperatura"
                stroke="#c0392b"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line
                yAxisId="hum"
                type="monotone"
                dataKey="humedad"
                name="humedad"
                stroke="#2980b9"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line
                yAxisId="ph"
                type="monotone"
                dataKey="ph"
                name="ph"
                stroke="#27ae60"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line
                yAxisId="o2"
                type="monotone"
                dataKey="oxigeno"
                name="oxigeno"
                stroke="#8e44ad"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
                connectNulls
              />
            </CycleChart>
          ) : (
            <CycleChart
              data={npkData}
              cycleStart={cycleStart}
              cycleEnd={cycleEnd}
              hoy={hoy}
              showHoyMarker={showHoyMarker}
              diasEstimados={diasEstimados}
            >
              <YAxis
                yAxisId="npk"
                tick={{ fontSize: 11, fill: '#9a9690' }}
                tickLine={false}
                axisLine={false}
                width={36}
                domain={['auto', 'auto']}
              />
              <YAxis
                yAxisId="cond"
                orientation="right"
                tick={{ fontSize: 11, fill: '#7f8c8d' }}
                tickLine={false}
                axisLine={false}
                width={40}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<ChartTooltip labels={npkLabels} units={npkUnits} />} />
              <Legend
                wrapperStyle={{ fontSize: '0.75rem', paddingTop: '0.5rem' }}
                formatter={(value) =>
                  value === 'nitrogeno'
                    ? 'Nitrógeno'
                    : value === 'fosforo'
                      ? 'Fósforo'
                      : value === 'potasio'
                        ? 'Potasio'
                        : 'Conductividad'
                }
              />
              <Line
                yAxisId="npk"
                type="monotone"
                dataKey="nitrogeno"
                name="nitrogeno"
                stroke="#8e44ad"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line
                yAxisId="npk"
                type="monotone"
                dataKey="fosforo"
                name="fosforo"
                stroke="#d35400"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line
                yAxisId="npk"
                type="monotone"
                dataKey="potasio"
                name="potasio"
                stroke="#16a085"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line
                yAxisId="cond"
                type="monotone"
                dataKey="conductividad"
                name="conductividad"
                stroke="#7f8c8d"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                connectNulls
              />
            </CycleChart>
          )}
        </div>

        <p className={styles.chartCaption}>
          Proceso completo · {formatDate(pila.fechaInicio)} — {formatDate(fechaEstimadaFin)}
          {lecturasEnProceso > 0 && ` · ${lecturasEnProceso} lecturas`}
        </p>
      </div>

      {chartView === 'ambiente' ? (
        <div className={styles.indicators}>
          <span
            className={`${styles.indicator} ${
              inRange(ultimaTemp, METRIC_RANGES.temperatura.min, METRIC_RANGES.temperatura.max)
                ? styles.indicatorOk
                : styles.indicatorBad
            }`}
          >
            <span className={styles.indicatorDot} />
            Temp: {formatMetricValue(ultimaTemp, METRIC_RANGES.temperatura.unit)}
          </span>
          <span
            className={`${styles.indicator} ${
              inRange(ultimaHum, METRIC_RANGES.humedad.min, METRIC_RANGES.humedad.max)
                ? styles.indicatorOk
                : styles.indicatorBad
            }`}
          >
            <span className={styles.indicatorDot} />
            Hum: {formatMetricValue(ultimaHum, METRIC_RANGES.humedad.unit)}
          </span>
          <span
            className={`${styles.indicator} ${
              inRange(ultimaPh, METRIC_RANGES.ph.min, METRIC_RANGES.ph.max)
                ? styles.indicatorOk
                : styles.indicatorBad
            }`}
          >
            <span className={styles.indicatorDot} />
            pH: {formatMetricValue(ultimaPh, METRIC_RANGES.ph.unit)}
          </span>
          <span
            className={`${styles.indicator} ${
              inRange(ultimaO2, METRIC_RANGES.oxigeno.min, METRIC_RANGES.oxigeno.max)
                ? styles.indicatorOk
                : styles.indicatorBad
            }`}
          >
            <span className={styles.indicatorDot} />
            O₂: {formatMetricValue(ultimaO2, METRIC_RANGES.oxigeno.unit)}
          </span>
        </div>
      ) : (
        <div className={styles.indicators}>
          <span className={`${styles.indicator} ${styles.indicatorNeutral}`}>
            N: {formatMetricValue(ultimaN, '')}
          </span>
          <span className={`${styles.indicator} ${styles.indicatorNeutral}`}>
            P: {formatMetricValue(ultimaP, '')}
          </span>
          <span className={`${styles.indicator} ${styles.indicatorNeutral}`}>
            K: {formatMetricValue(ultimaK, '')}
          </span>
          <span className={`${styles.indicator} ${styles.indicatorNeutral}`}>
            Cond: {formatMetricValue(ultimaCond, '')}
          </span>
        </div>
      )}

      <footer className={styles.footer}>
        {pendientes > 0 ? (
          <Link to="/alertas" className={styles.alertLink}>
            <AlertTriangle size={15} />
            {pendientes} {pendientes === 1 ? 'alerta sin resolver' : 'alertas sin resolver'}
          </Link>
        ) : (
          <span className={styles.noAlerts}>Sin alertas pendientes</span>
        )}
        <Link to={`/pilas/${pila.id}`} className={styles.detailLink}>
          ver detalle
          <ExternalLink size={14} />
        </Link>
      </footer>
    </article>
  )
}
