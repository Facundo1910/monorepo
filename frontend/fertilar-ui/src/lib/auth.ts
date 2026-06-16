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

export type AuthResult =
  | { status: 'ok'; username: string; email: string }
  | { status: 'new_password_required'; cognitoUser: CognitoUser }
  | { status: 'error'; message: string }

export function signIn(username: string, password: string): Promise<AuthResult> {
  return new Promise((resolve) => {
    const authDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    })

    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool,
    })

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
        const msg = mapCognitoError(err.code ?? err.name)
        resolve({ status: 'error', message: msg })
      },
      newPasswordRequired(_userAttributes, _requiredAttributes) {
        // Usuario creado desde consola — debe cambiar su clave
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
        resolve({ status: 'error', message: mapCognitoError(err.code ?? err.name) })
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

function mapCognitoError(code: string): string {
  switch (code) {
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
    default:
      return 'Ocurrió un error. Intentá de nuevo.'
  }
}
