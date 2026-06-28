import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import UsuarioModal from '../components/UsuarioModal'
import { useDialog } from '../context/DialogContext'
import { createUsuario, getUsuario, listUsuarios, updateUsuario } from '../lib/usuarios'
import type {
  Usuario,
  UsuarioCreateRequest,
  UsuarioRol,
  UsuarioUpdateRequest,
} from '../types/usuario'
import { ROL_LABEL } from '../types/usuario'
import styles from './UsuariosPage.module.css'

export default function UsuariosPage() {
  const dialog = useDialog()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setUsuarios(await listUsuarios())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los usuarios.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleNew = () => {
    setEditingUsuario(null)
    setModalOpen(true)
  }

  const handleEdit = async (id: string) => {
    try {
      const usuario = await getUsuario(id)
      setEditingUsuario(usuario)
      setModalOpen(true)
    } catch (err) {
      await dialog.error(err instanceof Error ? err.message : 'No se pudo cargar el usuario.')
    }
  }

  const handleSave = async (data: UsuarioCreateRequest | UsuarioUpdateRequest) => {
    if (editingUsuario) {
      await updateUsuario(editingUsuario.id, data as UsuarioUpdateRequest)
    } else {
      const created = await createUsuario(data as UsuarioCreateRequest)
      await dialog.alert(
        `Se envió un correo a ${created.email} con la contraseña temporal para ingresar.`,
      )
    }
    await loadData()
  }

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <div>
          <h1 className={styles.heading}>Usuarios</h1>
          <p className={styles.sub}>
            Gestioná cuentas del sistema: crear usuarios en Cognito, asignar roles y activar o
            desactivar accesos.
          </p>
        </div>
        <button type="button" className={styles.addBtn} onClick={handleNew}>
          <Plus size={16} strokeWidth={1.5} />
          nuevo usuario
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.sheet}>
        <div className={styles.sheetInner}>
          {loading ? (
            <div className={styles.loading}>cargando…</div>
          ) : usuarios.length === 0 ? (
            <div className={styles.empty}>Todavía no hay usuarios registrados.</div>
          ) : (
            <>
              <div className={styles.listMeta}>
                <span>registrados</span>
                <span className={styles.count}>{usuarios.length}</span>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>nombre</th>
                      <th>email</th>
                      <th>rol</th>
                      <th>estado</th>
                      <th>acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((usuario) => (
                      <tr key={usuario.id}>
                        <td>
                          {usuario.nombre} {usuario.apellido}
                        </td>
                        <td>{usuario.email}</td>
                        <td>
                          <span className={`${styles.rolBadge} ${styles[`rol_${usuario.rol}`]}`}>
                            {ROL_LABEL[usuario.rol as UsuarioRol]}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`${styles.estadoBadge} ${
                              usuario.activo ? styles.estadoActivo : styles.estadoInactivo
                            }`}
                          >
                            {usuario.activo ? 'activo' : 'inactivo'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => handleEdit(usuario.id)}
                          >
                            <Pencil size={14} strokeWidth={1.5} />
                            editar
                          </button>
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

      <UsuarioModal
        open={modalOpen}
        usuario={editingUsuario}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  )
}
