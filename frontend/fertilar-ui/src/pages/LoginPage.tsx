import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CognitoUser } from 'amazon-cognito-identity-js'
import styles from './LoginPage.module.css'
import FertilARLogo from '../components/FertilARLogo.tsx'
import {
  signIn,
  confirmNewPassword,
  requestPasswordReset,
  confirmPasswordReset,
} from '../lib/auth.ts'
import { useAuth } from '../context/AuthContext'

type Step = 'login' | 'new_password' | 'forgot_password' | 'confirm_reset'

function AuthShell({ children }: { children: ReactNode }) {
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
        <div className={styles.formCard}>{children}</div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { setUsuario } = useAuth()

  const [step, setStep] = useState<Step>('login')

  // Login
  const [inputUsuario, setInputUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [mantenerSesion, setMantenerSesion] = useState(false)

  // Cambio de clave obligatorio (usuario creado desde consola)
  const [pendingUser, setPendingUser] = useState<CognitoUser | null>(null)
  const [nuevaClave, setNuevaClave] = useState('')
  const [confirmarClave, setConfirmarClave] = useState('')

  // Recuperar clave
  const [resetUsuario, setResetUsuario] = useState('')
  const [codigoVerificacion, setCodigoVerificacion] = useState('')
  const [nuevaClaveReset, setNuevaClaveReset] = useState('')
  const [confirmarClaveReset, setConfirmarClaveReset] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const goToLogin = () => {
    setStep('login')
    setError('')
    setCodigoVerificacion('')
    setNuevaClaveReset('')
    setConfirmarClaveReset('')
  }

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

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

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!resetUsuario.trim()) {
      setError('Ingresá tu usuario o correo.')
      return
    }

    setLoading(true)
    const result = await requestPasswordReset(resetUsuario.trim())
    setLoading(false)

    if (result.status === 'ok') {
      setStep('confirm_reset')
    } else {
      setError(result.message)
    }
  }

  const handleConfirmReset = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!codigoVerificacion.trim() || !nuevaClaveReset || !confirmarClaveReset) {
      setError('Completá todos los campos.')
      return
    }
    if (nuevaClaveReset !== confirmarClaveReset) {
      setError('Las claves no coinciden.')
      return
    }

    setLoading(true)
    const result = await confirmPasswordReset(
      resetUsuario.trim(),
      codigoVerificacion.trim(),
      nuevaClaveReset,
    )
    setLoading(false)

    if (result.status === 'ok') {
      setInputUsuario(resetUsuario.trim())
      setClave('')
      setResetUsuario('')
      setSuccess('Clave actualizada. Ingresá con tu nueva clave.')
      goToLogin()
    } else {
      setError(result.message)
    }
  }

  if (step === 'new_password') {
    return (
      <AuthShell>
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
      </AuthShell>
    )
  }

  if (step === 'forgot_password') {
    return (
      <AuthShell>
        <h1 className={styles.title}>Recuperar Clave</h1>
        <p className={styles.subtitle}>
          Ingresá tu usuario o correo. Te enviaremos un código de verificación.
        </p>

        <form className={styles.form} onSubmit={handleForgotPassword} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="reset-usuario">
              USUARIO O CORREO
            </label>
            <input
              id="reset-usuario"
              className={styles.input}
              type="text"
              autoComplete="username"
              value={resetUsuario}
              onChange={(e) => setResetUsuario(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Código →'}
          </button>
        </form>

        <button type="button" className={styles.backLink} onClick={goToLogin}>
          ← Volver al inicio de sesión
        </button>

        <p className={styles.version}>v1.0</p>
      </AuthShell>
    )
  }

  if (step === 'confirm_reset') {
    return (
      <AuthShell>
        <h1 className={styles.title}>Nueva Clave</h1>
        <p className={styles.subtitle}>
          Ingresá el código que recibiste y elegí una nueva clave de acceso.
        </p>

        <form className={styles.form} onSubmit={handleConfirmReset} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="codigo">
              CÓDIGO DE VERIFICACIÓN
            </label>
            <input
              id="codigo"
              className={styles.input}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={codigoVerificacion}
              onChange={(e) => setCodigoVerificacion(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="nueva-clave-reset">
              NUEVA CLAVE
            </label>
            <input
              id="nueva-clave-reset"
              className={styles.input}
              type="password"
              autoComplete="new-password"
              value={nuevaClaveReset}
              onChange={(e) => setNuevaClaveReset(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirmar-clave-reset">
              CONFIRMAR CLAVE
            </label>
            <input
              id="confirmar-clave-reset"
              className={styles.input}
              type="password"
              autoComplete="new-password"
              value={confirmarClaveReset}
              onChange={(e) => setConfirmarClaveReset(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Guardando...' : 'Restablecer Clave →'}
          </button>
        </form>

        <button
          type="button"
          className={styles.backLink}
          onClick={() => {
            setError('')
            setStep('forgot_password')
          }}
        >
          ← Solicitar un nuevo código
        </button>

        <p className={styles.version}>v1.0</p>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
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
              onClick={() => {
                setError('')
                setSuccess('')
                setResetUsuario(inputUsuario.trim())
                setStep('forgot_password')
              }}
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

        {success && <p className={styles.success}>{success}</p>}
        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Verificando...' : 'Ingresar al Sistema →'}
        </button>
      </form>

      <p className={styles.version}>v1.0</p>
    </AuthShell>
  )
}
