import type { PilaFases } from '../types/fases'
import { apiFetch } from './api'
import { getTokens } from './auth'

async function authFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const tokens = await getTokens()
  return apiFetch<T>(path, options, tokens?.idToken)
}

export function getPilaFases(pilaId: string): Promise<PilaFases> {
  return authFetch<PilaFases>(`/pilas/${pilaId}/fases`)
}
