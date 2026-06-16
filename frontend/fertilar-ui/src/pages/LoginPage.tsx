import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CognitoUser } from 'amazon-cognito-identity-js'
import styles from './LoginPage.module.css'
import FertilARLogo from '../components/FertilARLogo.tsx'
import { signIn, confirmNewPassword } from '../lib/auth.ts'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setUsuario } = useAuth()

  // Paso 1 — credenciales
  const [inputUsuario, setInputUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [mantenerSesion, setMantenerSesion] = useState(false)

  // Paso 2 — cambio de clave obligatorio (usuario creado desde consola)
  const [step, setStep] = useState<'login' | 'new_password'>('login')
  const [pendingUser, setPendingUser] = useState<CognitoUser | null>(null)
  const [nuevaClave, setNuevaClave] = useState('')
  const [confirmarClave, setConfirmarClave] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /* ── Paso 1: autenticar ── */
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!inputUsuario.trim() || !clave.trim()) {
      setError('Completá los campos para continuar.')
      return
    }

    setLoading(true)
    const result = await signIn(inputUsuario.trim(), clave)
    setLoading(false)

    if (result.status === 'ok') {
      setUsuario({ username: result.username, email: result.email })
      navigate('/dashboard')
    } else if (result.status === 'new_password_required') {
      setPendingUser(result.cognitoUser)
      setStep('new_password')
    } else if (result.status === 'error') {
      setError(result.message)
    }
  }

  /* ── Paso 2: confirmar nueva clave ── */
  const handleNewPassword = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!nuevaClave || !confirmarClave) {
      setError('Completá los dos campos.')
      return
    }
    if (nuevaClave !== confirmarClave) {
      setError('Las claves no coinciden.')
      return
    }
    if (!pendingUser) return

    setLoading(true)
    const result = await confirmNewPassword(pendingUser, nuevaClave)
    setLoading(false)

    if (result.status === 'ok') {
      setUsuario({ username: result.username, email: result.email })
      navigate('/dashboard')
    } else if (result.status === 'error') {
      setError(result.message)
    }
  }

  /* ── Render: cambio de clave ── */
  if (step === 'new_password') {
    return (
      <div className={styles.root}>
        <div className={styles.hero}>
          <div className={styles.heroOverlay} />
          <div className={styles.heroBranding}>
            <FertilARLogo />
            <p className={styles.heroTagline}>
              Sistema de Telemetría y Trazabilidad para el Monitoreo del
              Compostaje de Guano Avícola
            </p>
          </div>
        </div>

        <div className={styles.formPanel}>
          <div className={styles.formCard}>
            <h1 className={styles.title}>Nueva Clave</h1>
            <p className={styles.subtitle}>
              Tu cuenta requiere que establezcas una nueva clave de acceso.
            </p>

            <form className={styles.form} onSubmit={handleNewPassword} noValidate>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="nueva-clave">
                  NUEVA CLAVE
                </label>
                <input
                  id="nueva-clave"
                  className={styles.input}
                  type="password"
                  autoComplete="new-password"
                  value={nuevaClave}
                  onChange={(e) => setNuevaClave(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="confirmar-clave">
                  CONFIRMAR CLAVE
                </label>
                <input
                  id="confirmar-clave"
                  className={styles.input}
                  type="password"
                  autoComplete="new-password"
                  value={confirmarClave}
                  onChange={(e) => setConfirmarClave(e.target.value)}
                  disabled={loading}
                />
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Guardando...' : 'Confirmar y Entrar →'}
              </button>
            </form>

            <p className={styles.version}>v1.0</p>
          </div>
        </div>
      </div>
    )
  }

  /* ── Render: login normal ── */
  return (
    <div className={styles.root}>
      <div className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroBranding}>
          <FertilARLogo />
          <p className={styles.heroTagline}>
            Sistema de Telemetría y Trazabilidad para el Monitoreo del
            Compostaje de Guano Avícola
          </p>
        </div>
      </div>

      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          <h1 className={styles.title}>Iniciar Sesión</h1>
          <p className={styles.subtitle}>
            Ingresá tus credenciales de acceso seguro.
          </p>

          <form className={styles.form} onSubmit={handleLogin} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="usuario">
                USUARIO O CORREO
              </label>
              <input
                id="usuario"
                className={styles.input}
                type="text"
                autoComplete="username"
                value={inputUsuario}
                onChange={(e) => setInputUsuario(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label className={styles.label} htmlFor="clave">
                  CLAVE DE ACCESO
                </label>
                <button
                  type="button"
                  className={styles.forgotLink}
                  onClick={() => alert('Función de recuperación próximamente.')}
                >
                  ¿Recuperar clave?
                </button>
              </div>
              <input
                id="clave"
                className={styles.input}
                type="password"
                autoComplete="current-password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                disabled={loading}
              />
            </div>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={mantenerSesion}
                onChange={(e) => setMantenerSesion(e.target.checked)}
                disabled={loading}
              />
              <span className={styles.checkboxLabel}>Mantener sesión activa</span>
            </label>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Verificando...' : 'Ingresar al Sistema →'}
            </button>
          </form>

          <p className={styles.version}>v1.0</p>
        </div>
      </div>
    </div>
  )
}
