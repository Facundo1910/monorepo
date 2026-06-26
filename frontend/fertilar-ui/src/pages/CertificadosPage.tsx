import { useCallback, useEffect, useState } from 'react'
import { ExternalLink, Layers, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDialog } from '../context/DialogContext'
import { deleteCertificado, listCertificados } from '../lib/certificados'
import { getCurrentUsuario } from '../lib/usuarios'
import type { Certificado } from '../types/certificado'
import type { UsuarioRol } from '../types/usuario'
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
  const [certificados, setCertificados] = useState<Certificado[]>([])
  const [rol, setRol] = useState<UsuarioRol | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [data, perfil] = await Promise.all([
        listCertificados(),
        getCurrentUsuario().catch(() => null),
      ])
      setCertificados(data)
      setRol(perfil?.rol ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los certificados.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

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
          <h1 className={styles.heading}>certificados</h1>
          <p className={styles.sub}>
            Todos los certificados emitidos. Para generar uno nuevo, finalizá una pila y emitilo
            desde su detalle.
          </p>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.sheet}>
        <div className={styles.sheetInner}>
          {loading ? (
            <div className={styles.loading}>cargando…</div>
          ) : certificados.length === 0 ? (
            <div className={styles.empty}>
              Todavía no hay certificados emitidos.
              <br />
              Finalizá una pila y emití el certificado desde su detalle.
            </div>
          ) : (
            <>
              <div className={styles.listMeta}>
                <span>emitidos</span>
                <span className={styles.count}>{certificados.length}</span>
              </div>
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
                    {certificados.map((cert) => (
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
                            <Link
                              to={`/pilas/${cert.pilaId}`}
                              className={styles.actionBtn}
                            >
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}
