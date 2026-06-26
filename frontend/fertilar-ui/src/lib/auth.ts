import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} from 'amazon-cognito-identity-js'
import { syncUsuario } from './api'

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID as string,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID as string,
}

const userPool = new CognitoUserPool(poolData)

function createCognitoUser(username: string): CognitoUser {
  return new CognitoUser({ Username: username, Pool: userPool })
}

export type AuthResult =
  | { status: 'ok'; username: string; email: string }
  | { status: 'new_password_required'; cognitoUser: CognitoUser }
  | { status: 'error'; message: string }

export type ResetResult =
  | { status: 'ok' }
  | { status: 'error'; message: string }

export function signIn(username: string, password: string): Promise<AuthResult> {
  return new Promise((resolve) => {
    const authDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    })

    const cognitoUser = createCognitoUser(username)

    cognitoUser.authenticateUser(authDetails, {
      async onSuccess(session) {
        const idToken = session.getIdToken()
        const payload = idToken.decodePayload()
        await syncUsuario(idToken.getJwtToken())
        resolve({
          status: 'ok',
          username: payload['cognito:username'] ?? username,
          email: payload['email'] ?? '',
        })
      },
      onFailure(err) {
        console.error('[Cognito error]', err)
        resolve({ status: 'error', message: mapCognitoError(getCognitoErrorCode(err)) })
      },
      newPasswordRequired(_userAttributes, _requiredAttributes) {
        resolve({ status: 'new_password_required', cognitoUser })
      },
    })
  })
}

export function confirmNewPassword(
  cognitoUser: CognitoUser,
  newPassword: string,
): Promise<AuthResult> {
  return new Promise((resolve) => {
    cognitoUser.completeNewPasswordChallenge(newPassword, {}, {
      async onSuccess(session) {
        const idToken = session.getIdToken()
        const payload = idToken.decodePayload()
        await syncUsuario(idToken.getJwtToken())
        resolve({
          status: 'ok',
          username: payload['cognito:username'],
          email: payload['email'] ?? '',
        })
      },
      onFailure(err) {
        resolve({ status: 'error', message: mapCognitoError(getCognitoErrorCode(err)) })
      },
    })
  })
}

export function requestPasswordReset(username: string): Promise<ResetResult> {
  return new Promise((resolve) => {
    createCognitoUser(username).forgotPassword({
      onSuccess() {
        resolve({ status: 'ok' })
      },
      onFailure(err) {
        console.error('[Cognito error]', err)
        resolve({
          status: 'error',
          message: mapCognitoError(getCognitoErrorCode(err), err.message),
        })
      },
    })
  })
}

export function confirmPasswordReset(
  username: string,
  code: string,
  newPassword: string,
): Promise<ResetResult> {
  return new Promise((resolve) => {
    createCognitoUser(username).confirmPassword(code, newPassword, {
      onSuccess() {
        resolve({ status: 'ok' })
      },
      onFailure(err) {
        resolve({ status: 'error', message: mapCognitoError(getCognitoErrorCode(err)) })
      },
    })
  })
}

export type Tokens = {
  idToken: string
  accessToken: string
  refreshToken: string
}

export function getTokens(): Promise<Tokens | null> {
  return new Promise((resolve) => {
    const user = userPool.getCurrentUser()
    if (!user) return resolve(null)

    user.getSession((err: Error | null, session: { isValid: () => boolean; getIdToken: () => { getJwtToken: () => string }; getAccessToken: () => { getJwtToken: () => string }; getRefreshToken: () => { getToken: () => string } } | null) => {
      if (err || !session?.isValid()) return resolve(null)
      resolve({
        idToken: session.getIdToken().getJwtToken(),
        accessToken: session.getAccessToken().getJwtToken(),
        refreshToken: session.getRefreshToken().getToken(),
      })
    })
  })
}

export function signOut(): void {
  userPool.getCurrentUser()?.signOut()
}

type CognitoError = Error & { code?: string }

function getCognitoErrorCode(err: Error): string {
  return (err as CognitoError).code ?? err.name
}

function mapCognitoError(code: string, message?: string): string {
  if (message?.includes('no registered/verified email or phone')) {
    return 'Tu cuenta no tiene un correo o teléfono verificado. Contactá al administrador.'
  }

  switch (code) {
    case 'InvalidParameterException':
      return 'Datos inválidos. Verificá la información e intentá de nuevo.'
    case 'NotAuthorizedException':
      return 'Usuario o clave incorrectos.'
    case 'UserNotFoundException':
      return 'El usuario no existe.'
    case 'UserNotConfirmedException':
      return 'El usuario aún no fue confirmado.'
    case 'PasswordResetRequiredException':
      return 'Debés restablecer tu clave antes de continuar.'
    case 'TooManyRequestsException':
    case 'LimitExceededException':
      return 'Demasiados intentos. Esperá unos minutos.'
    case 'InvalidPasswordException':
      return 'La nueva clave no cumple los requisitos de seguridad.'
    case 'CodeMismatchException':
      return 'El código de verificación es incorrecto.'
    case 'ExpiredCodeException':
      return 'El código expiró. Solicitá uno nuevo.'
    case 'CodeDeliveryFailureException':
      return 'No se pudo enviar el código. Verificá tu correo e intentá de nuevo.'
    default:
      return 'Ocurrió un error. Intentá de nuevo.'
  }
}
