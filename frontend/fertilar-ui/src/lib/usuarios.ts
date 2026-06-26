import type { UsuarioPerfil } from '../types/usuario'
import { apiFetch } from './api'
import { getTokens } from './auth'

async function authFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const tokens = await getTokens()
  return apiFetch<T>(path, options, tokens?.idToken)
}

export function getCurrentUsuario(): Promise<UsuarioPerfil> {
  return authFetch<UsuarioPerfil>('/usuarios/me')
}
