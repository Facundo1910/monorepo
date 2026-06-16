import type { Pila, PilaRequest, PilaResumen } from '../types/pila'
import { apiFetch } from './api'
import { getTokens } from './auth'

async function authFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const tokens = await getTokens()
  return apiFetch<T>(path, options, tokens?.idToken)
}

export function listPilas(): Promise<PilaResumen[]> {
  return authFetch<PilaResumen[]>('/pilas')
}

export function getPila(id: string): Promise<Pila> {
  return authFetch<Pila>(`/pilas/${id}`)
}

export function createPila(data: PilaRequest): Promise<Pila> {
  return authFetch<Pila>('/pilas', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updatePila(id: string, data: PilaRequest): Promise<Pila> {
  return authFetch<Pila>(`/pilas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deletePila(id: string): Promise<void> {
  return authFetch<void>(`/pilas/${id}`, { method: 'DELETE' })
}
