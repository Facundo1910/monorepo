import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import AlertaModal from '../components/AlertaModal'
import ListSearchBar from '../components/ListSearchBar'
import { useDialog } from '../context/DialogContext'
import { listAlertas, resolverAlerta } from '../lib/alertas'
import { listPilas } from '../lib/pilas'
import type { Alerta } from '../types/alerta'
import type { PilaResumen } from '../types/pila'
import { matchesSearch } from '../utils/searchText'
import styles from './AlertasPage.module.css'

type Filtro = 'activas' | 'resueltas' | 'todas'

const NIVEL_LABEL: Record<Alerta['nivel'], string> = {
  INFO: 'info',
  ADVERTENCIA: 'advertencia',
  CRITICA: 'crítica',
}

const NIVEL_CLASS: Record<Alerta['nivel'], string> = {
  INFO: styles.nivelInfo,
  ADVERTENCIA: styles.nivelAdvertencia,
  CRITICA: styles.nivelCritica,
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AlertasPage() {
  const dialog = useDialog()
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [pilas, setPilas] = useState<PilaResumen[]>([])
  const [filtro, setFiltro] = useState<Filtro>('activas')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedAlerta, setSelectedAlerta] = useState<Alerta | null>(null)
  const [search, setSearch] = useState('')

  const pilaPorId = useMemo(
    () => new Map(pilas.map((p) => [p.id, p])),
    [pilas],
  )

  const loadData = useCallback(async (currentFiltro: Filtro) => {
    setLoading(true)
    setError('')
    try {
      const resuelta = currentFiltro === 'todas' ? undefined : currentFiltro === 'resueltas'
      const [alertasData, pilasData] = await Promise.all([
        listAlertas(resuelta),
        listPilas(),
      ])
      setAlertas(
        [...alertasData].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      )
      setPilas(pilasData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las alertas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(filtro)
  }, [filtro, loadData])

  const pendientes = useMemo(
    () => alertas.filter((a) => !a.resuelta).length,
    [alertas],
  )

  const alertasFiltradas = useMemo(
    () =>
      alertas.filter((alerta) => {
        const pila = pilaPorId.get(alerta.pilaId)
        return matchesSearch(
          search,
          alerta.tipo,
          alerta.mensaje,
          pila?.nombre,
          NIVEL_LABEL[alerta.nivel],
          alerta.nivel,
          alerta.resuelta ? 'resuelta' : 'pendiente',
          formatDateTime(alerta.createdAt),
        )
      }),
    [alertas, pilaPorId, search],
  )

  const handleResolve = async (id: string, tipo: string) => {
    const ok = await dialog.confirm(
      `¿Marcar como resuelta la alerta "${tipo}"?`,
      'resolver alerta',
      { confirmLabel: 'resolver' },
    )
    if (!ok) return
    try {
      await resolverAlerta(id)
      await loadData(filtro)
    } catch (err) {
      await dialog.error(
        err instanceof Error ? err.message : 'No se pudo resolver la alerta.',
      )
    }
  }

  const handleResolveFromModal = async (id: string) => {
    await resolverAlerta(id)
    await loadData(filtro)
  }

  const emptyMessage = {
    activas: 'No hay alertas pendientes.',
    resueltas: 'No hay alertas resueltas.',
    todas: 'Todavía no hay alertas registradas.',
  }[filtro]

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <h1 className={styles.heading}>Alertas</h1>
        <p className={styles.sub}>
          Alertas generadas por lecturas fuera de rango. Podés marcarlas como resueltas cuando las atiendas.
        </p>
      </div>

      <div className={styles.filters}>
        {(['activas', 'resueltas', 'todas'] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={`${styles.filterBtn} ${filtro === f ? styles.filterBtnActive : ''}`}
            onClick={() => {
              setFiltro(f)
              setSearch('')
            }}
          >
            {f}
          </button>
        ))}
        {!loading && (
          <ListSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar por tipo, mensaje o pila…"
          />
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.sheet}>
        <div className={styles.sheetInner}>
          {loading ? (
            <div className={styles.loading}>cargando…</div>
          ) : alertas.length === 0 ? (
            <div className={styles.empty}>{emptyMessage}</div>
          ) : alertasFiltradas.length === 0 ? (
            <div className={styles.empty}>No hay alertas que coincidan con la búsqueda.</div>
          ) : (
            <>
              <div className={styles.listMeta}>
                <span>{filtro === 'activas' ? 'pendientes' : filtro === 'resueltas' ? 'resueltas' : 'total'}</span>
                <span className={styles.count}>{alertasFiltradas.length}</span>
              </div>
              <div className={styles.list}>
                {alertasFiltradas.map((alerta) => {
                  const pila = pilaPorId.get(alerta.pilaId)
                  return (
                    <article key={alerta.id} className={styles.row}>
                      <button
                        type="button"
                        className={styles.card}
                        onClick={() => setSelectedAlerta(alerta)}
                      >
                        <span className={`${styles.nivel} ${NIVEL_CLASS[alerta.nivel]}`}>
                          {NIVEL_LABEL[alerta.nivel]}
                        </span>
                        <div className={styles.info}>
                          <span className={styles.tipo}>{alerta.tipo}</span>
                          <span className={styles.mensaje}>{alerta.mensaje}</span>
                          <span className={styles.meta}>
                            {pila?.nombre ?? 'pila desconocida'}
                            {' · '}
                            {formatDateTime(alerta.createdAt)}
                          </span>
                        </div>
                        <span
                          className={`${styles.status} ${alerta.resuelta ? styles.statusResuelta : ''}`}
                        >
                          {alerta.resuelta ? 'resuelta' : 'pendiente'}
                        </span>
                      </button>
                      {!alerta.resuelta && (
                        <div className={styles.actions}>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => handleResolve(alerta.id, alerta.tipo)}
                            aria-label={`Resolver alerta ${alerta.tipo}`}
                          >
                            <CheckCircle2 size={15} strokeWidth={1.5} />
                          </button>
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {alertas.length > 0 && filtro !== 'resueltas' && pendientes > 0 && (
        <p className={styles.note}>
          {pendientes} {pendientes === 1 ? 'alerta pendiente' : 'alertas pendientes'}
        </p>
      )}

      <AlertaModal
        open={selectedAlerta !== null}
        alerta={selectedAlerta}
        pila={selectedAlerta ? pilaPorId.get(selectedAlerta.pilaId) : undefined}
        onClose={() => setSelectedAlerta(null)}
        onResolve={handleResolveFromModal}
      />
    </div>
  )
}
