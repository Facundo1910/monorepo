import type { Umbral, UmbralRequest } from '../types/umbral'
import { apiFetch } from './api'
import { getTokens } from './auth'

async function authFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const tokens = await getTokens()
  return apiFetch<T>(path, options, tokens?.idToken)
}

export function listUmbralesPorPila(pilaId: string): Promise<Umbral[]> {
  return authFetch<Umbral[]>(`/pilas/${pilaId}/umbrales`)
}

export function getUmbral(id: string): Promise<Umbral> {
  return authFetch<Umbral>(`/umbrales/${id}`)
}

export function createUmbral(pilaId: string, data: UmbralRequest): Promise<Umbral> {
  return authFetch<Umbral>(`/pilas/${pilaId}/umbrales`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateUmbral(id: string, data: UmbralRequest): Promise<Umbral> {
  return authFetch<Umbral>(`/umbrales/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteUmbral(id: string): Promise<void> {
  return authFetch<void>(`/umbrales/${id}`, { method: 'DELETE' })
}
