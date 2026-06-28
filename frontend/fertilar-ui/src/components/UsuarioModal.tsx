import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { Usuario, UsuarioCreateRequest, UsuarioRol, UsuarioUpdateRequest } from '../types/usuario'
import { ROL_LABEL } from '../types/usuario'
import styles from './PilaModal.module.css'

type UsuarioModalProps = {
  open: boolean
  usuario?: Usuario | null
  onClose: () => void
  onSave: (data: UsuarioCreateRequest | UsuarioUpdateRequest) => Promise<void>
}

const ROLES: UsuarioRol[] = ['OPERARIO', 'ENCARGADO', 'ADMIN']

const emptyCreateForm = (): UsuarioCreateRequest => ({
  email: '',
  nombre: '',
  apellido: '',
  rol: 'OPERARIO',
  contrasenaTemporal: '',
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

/** Evita mostrar el email copiado en nombre (sync Cognito o autocompletado del navegador). */
function nombreParaFormulario(usuario: Usuario): string {
  const nombre = usuario.nombre?.trim() ?? ''
  const email = usuario.email?.trim().toLowerCase() ?? ''
  if (!nombre) return ''
  if (email && nombre.toLowerCase() === email) return ''
  if (nombre.includes('@')) return ''
  return nombre
}

export default function UsuarioModal({ open, usuario, onClose, onSave }: UsuarioModalProps) {
  const isEdit = Boolean(usuario)
  const [createForm, setCreateForm] = useState<UsuarioCreateRequest>(emptyCreateForm())
  const [editForm, setEditForm] = useState<UsuarioUpdateRequest>({
    nombre: '',
    apellido: '',
    rol: 'OPERARIO',
    activo: true,
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setError('')
    if (usuario) {
      setEditForm({
        nombre: nombreParaFormulario(usuario),
        apellido: usuario.apellido?.trim() ?? '',
        rol: usuario.rol,
        activo: usuario.activo,
      })
    } else {
      setCreateForm(emptyCreateForm())
    }
  }, [open, usuario])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (isEdit && usuario) {
        await onSave(editForm)
      } else {
        const payload: UsuarioCreateRequest = {
          ...createForm,
          email: createForm.email.trim(),
          nombre: createForm.nombre.trim(),
          apellido: createForm.apellido.trim(),
          contrasenaTemporal: createForm.contrasenaTemporal?.trim() || undefined,
        }
        await onSave(payload)
      }
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
          <h2 className={styles.title}>{isEdit ? 'Editar usuario' : 'Nuevo usuario'}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <form className={styles.formShell} onSubmit={handleSubmit} autoComplete="off">
          <div className={styles.formBody}>
            <div className={styles.form}>
              {error && <div className={styles.error}>{error}</div>}

              {isEdit ? (
                <>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="usuario-email-readonly">
                      email
                    </label>
                    <input
                      id="usuario-email-readonly"
                      className={styles.input}
                      value={usuario?.email ?? ''}
                      disabled
                      autoComplete="off"
                      readOnly
                    />
                  </div>
                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="usuario-nombre">
                        nombre
                      </label>
                      <input
                        id="usuario-nombre"
                        className={styles.input}
                        value={editForm.nombre}
                        onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                        autoComplete="off"
                        name="usuario-nombre"
                        required
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="usuario-apellido">
                        apellido
                      </label>
                      <input
                        id="usuario-apellido"
                        className={styles.input}
                        value={editForm.apellido}
                        onChange={(e) => setEditForm({ ...editForm, apellido: e.target.value })}
                        autoComplete="off"
                        name="usuario-apellido"
                        required
                      />
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="usuario-rol">
                      rol
                    </label>
                    <select
                      id="usuario-rol"
                      className={styles.select}
                      value={editForm.rol}
                      onChange={(e) =>
                        setEditForm({ ...editForm, rol: e.target.value as UsuarioRol })
                      }
                    >
                      {ROLES.map((rol) => (
                        <option key={rol} value={rol}>
                          {ROL_LABEL[rol]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <label className={styles.checkboxField} htmlFor="usuario-activo">
                    <input
                      id="usuario-activo"
                      type="checkbox"
                      className={styles.checkbox}
                      checked={editForm.activo}
                      onChange={(e) => setEditForm({ ...editForm, activo: e.target.checked })}
                    />
                    <span>usuario activo</span>
                  </label>
                </>
              ) : (
                <>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="usuario-email">
                      email
                    </label>
                    <input
                      id="usuario-email"
                      type="email"
                      className={styles.input}
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      autoComplete="off"
                      name="usuario-email-new"
                      required
                    />
                  </div>
                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="usuario-nombre-new">
                        nombre
                      </label>
                      <input
                        id="usuario-nombre-new"
                        className={styles.input}
                        value={createForm.nombre}
                        onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
                        autoComplete="off"
                        name="usuario-nombre-new"
                        required
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="usuario-apellido-new">
                        apellido
                      </label>
                      <input
                        id="usuario-apellido-new"
                        className={styles.input}
                        value={createForm.apellido}
                        onChange={(e) => setCreateForm({ ...createForm, apellido: e.target.value })}
                        autoComplete="off"
                        name="usuario-apellido-new"
                        required
                      />
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="usuario-rol-new">
                      rol
                    </label>
                    <select
                      id="usuario-rol-new"
                      className={styles.select}
                      value={createForm.rol}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, rol: e.target.value as UsuarioRol })
                      }
                    >
                      {ROLES.map((rol) => (
                        <option key={rol} value={rol}>
                          {ROL_LABEL[rol]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="usuario-pass">
                      contraseña temporal
                    </label>
                    <input
                      id="usuario-pass"
                      type="text"
                      className={styles.input}
                      value={createForm.contrasenaTemporal ?? ''}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, contrasenaTemporal: e.target.value })
                      }
                    />
                    <p className={styles.hint}>
                      Si no completás este campo, se genera una automática y Cognito la envía por
                      correo al usuario.
                    </p>
                  </div>
                </>
              )}
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
