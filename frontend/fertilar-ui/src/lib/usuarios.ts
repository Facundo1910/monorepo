import type {
  Usuario,
  UsuarioCreateRequest,
  UsuarioPerfil,
  UsuarioUpdateRequest,
} from '../types/usuario'
import { apiFetch } from './api'
import { getTokens } from './auth'

async function authFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const tokens = await getTokens()
  return apiFetch<T>(path, options, tokens?.idToken)
}

export function getCurrentUsuario(): Promise<UsuarioPerfil> {
  return authFetch<UsuarioPerfil>('/usuarios/me')
}

export function listUsuarios(): Promise<Usuario[]> {
  return authFetch<Usuario[]>('/usuarios')
}

export function getUsuario(id: string): Promise<Usuario> {
  return authFetch<Usuario>(`/usuarios/${id}`)
}

export function createUsuario(data: UsuarioCreateRequest): Promise<Usuario> {
  return authFetch<Usuario>('/usuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function updateUsuario(id: string, data: UsuarioUpdateRequest): Promise<Usuario> {
  return authFetch<Usuario>(`/usuarios/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}
