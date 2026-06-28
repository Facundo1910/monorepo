import { useCallback, useEffect, useMemo, useState } from 'react'
import { ExternalLink, Layers, Trash2 } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import CertificacionEvaluacion from '../components/CertificacionEvaluacion'
import ListSearchBar from '../components/ListSearchBar'
import { useDialog } from '../context/DialogContext'
import { deleteCertificado, listCertificados } from '../lib/certificados'
import { listPilas } from '../lib/pilas'
import { getCurrentUsuario } from '../lib/usuarios'
import type { Certificado } from '../types/certificado'
import type { PilaResumen } from '../types/pila'
import type { UsuarioRol } from '../types/usuario'
import { matchesSearch } from '../utils/searchText'
import styles from './CertificadosPage.module.css'

function formatDate(date: string): string {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

function canGestionar(rol: UsuarioRol | null): boolean {
  return rol === 'ADMIN' || rol === 'ENCARGADO'
}

export default function CertificadosPage() {
  const dialog = useDialog()
  const [searchParams, setSearchParams] = useSearchParams()
  const [certificados, setCertificados] = useState<Certificado[]>([])
  const [pilas, setPilas] = useState<PilaResumen[]>([])
  const [rol, setRol] = useState<UsuarioRol | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const pilaSeleccionada = searchParams.get('pila') ?? ''

  const certificadosFiltrados = useMemo(
    () =>
      certificados.filter((cert) =>
        matchesSearch(
          search,
          cert.numero,
          cert.pilaNombre,
          cert.usuarioNombre,
          formatDate(cert.fechaEmision),
          cert.fechaEmision,
        ),
      ),
    [certificados, search],
  )

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [data, perfil, pilasData] = await Promise.all([
        listCertificados(),
        getCurrentUsuario().catch(() => null),
        listPilas().catch(() => [] as PilaResumen[]),
      ])
      setCertificados(data)
      setRol(perfil?.rol ?? null)
      setPilas(pilasData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los certificados.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!canGestionar(rol) || pilaSeleccionada || pilas.length === 0) return
    setSearchParams({ pila: pilas[0].id }, { replace: true })
  }, [rol, pilaSeleccionada, pilas, setSearchParams])

  const handlePilaChange = (pilaId: string) => {
    if (pilaId) {
      setSearchParams({ pila: pilaId })
    } else {
      setSearchParams({})
    }
  }

  const handleDelete = async (cert: Certificado) => {
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

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <div>
          <h1 className={styles.heading}>Certificados</h1>
          <p className={styles.sub}>
            Evaluá las fases del compost según la Resolución N°29/2017 y emití certificados.
            Abajo encontrás el historial de emitidos.
          </p>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {canGestionar(rol) && !loading && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Evaluar y emitir</h2>
            <div className={styles.pilaSelectWrap}>
              <label className={styles.pilaSelectLabel} htmlFor="cert-pila-select">
                pila
              </label>
              <select
                id="cert-pila-select"
                className={styles.pilaSelect}
                value={pilaSeleccionada}
                onChange={(e) => handlePilaChange(e.target.value)}
              >
                {pilas.length === 0 ? (
                  <option value="">No hay pilas</option>
                ) : (
                  pilas.map((pila) => (
                    <option key={pila.id} value={pila.id}>
                      {pila.nombre} ({pila.estado.toLowerCase()})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
          {pilaSeleccionada ? (
            <CertificacionEvaluacion
              pilaId={pilaSeleccionada}
              onCertificadoEmitido={loadData}
            />
          ) : (
            <p className={styles.sectionEmpty}>Seleccioná una pila para evaluar sus fases.</p>
          )}
        </section>
      )}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Certificados emitidos</h2>
          {!loading && certificados.length > 0 && (
            <span className={styles.countBadge}>{certificadosFiltrados.length}</span>
          )}
        </div>

        {!loading && certificados.length > 0 && (
          <div className={styles.searchWrap}>
            <ListSearchBar
              value={search}
              onChange={setSearch}
              placeholder="Buscar por número, pila o emisor…"
            />
          </div>
        )}

        {loading ? (
          <div className={styles.loading}>cargando…</div>
        ) : certificados.length === 0 ? (
          <div className={styles.empty}>Todavía no hay certificados emitidos.</div>
        ) : certificadosFiltrados.length === 0 ? (
          <div className={styles.empty}>No hay certificados que coincidan con la búsqueda.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>número</th>
                  <th>pila</th>
                  <th>fecha emisión</th>
                  <th>emitido por</th>
                  <th>acciones</th>
                </tr>
              </thead>
              <tbody>
                {certificadosFiltrados.map((cert) => (
                  <tr key={cert.id}>
                    <td className={styles.numero}>{cert.numero}</td>
                    <td>{cert.pilaNombre}</td>
                    <td>{formatDate(cert.fechaEmision)}</td>
                    <td>{cert.usuarioNombre.trim() || '—'}</td>
                    <td>
                      <div className={styles.actions}>
                        <a
                          href={cert.urlDocumento}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.actionBtn}
                        >
                          <ExternalLink size={14} strokeWidth={1.5} />
                          ver
                        </a>
                        <Link to={`/pilas/${cert.pilaId}`} className={styles.actionBtn}>
                          <Layers size={14} strokeWidth={1.5} />
                          pila
                        </Link>
                        {canGestionar(rol) && (
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                            onClick={() => handleDelete(cert)}
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
    </div>
  )
}
