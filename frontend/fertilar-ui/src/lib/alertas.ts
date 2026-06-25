import type { Alerta, AlertaResolverResponse } from '../types/alerta'
import { apiFetch } from './api'
import { getTokens } from './auth'

async function authFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const tokens = await getTokens()
  return apiFetch<T>(path, options, tokens?.idToken)
}

export function listAlertas(resuelta?: boolean): Promise<Alerta[]> {
  const query = resuelta === undefined ? '' : `?resuelta=${resuelta}`
  return authFetch<Alerta[]>(`/alertas${query}`)
}

export function getAlerta(id: string): Promise<Alerta> {
  return authFetch<Alerta>(`/alertas/${id}`)
}

export function listAlertasPorPila(pilaId: string): Promise<Alerta[]> {
  return authFetch<Alerta[]>(`/pilas/${pilaId}/alertas`)
}

export function resolverAlerta(id: string): Promise<AlertaResolverResponse> {
  return authFetch<AlertaResolverResponse>(`/alertas/${id}/resolver`, {
    method: 'PUT',
  })
}
