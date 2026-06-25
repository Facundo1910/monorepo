import type { Lectura, LecturaPage, LecturaRequest } from '../types/lectura'
import { apiFetch } from './api'
import { getTokens } from './auth'

async function authFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const tokens = await getTokens()
  return apiFetch<T>(path, options, tokens?.idToken)
}

export function listLecturas(page = 0, size = 20): Promise<LecturaPage> {
  return authFetch<LecturaPage>(`/lecturas?page=${page}&size=${size}`)
}

export function getLectura(id: string): Promise<Lectura> {
  return authFetch<Lectura>(`/lecturas/${id}`)
}

export function createLectura(data: LecturaRequest): Promise<Lectura> {
  return authFetch<Lectura>('/lecturas', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

type SensorLecturasParams = {
  desde?: string
  hasta?: string
  limit?: number
}

export function listLecturasPorSensor(
  sensorId: string,
  params: SensorLecturasParams = {},
): Promise<Lectura[]> {
  const query = new URLSearchParams()
  if (params.desde) query.set('desde', params.desde)
  if (params.hasta) query.set('hasta', params.hasta)
  if (params.limit !== undefined) query.set('limit', String(params.limit))
  const suffix = query.toString() ? `?${query}` : ''
  return authFetch<Lectura[]>(`/sensores/${sensorId}/lecturas${suffix}`)
}

export function listLecturasPorPila(
  pilaId: string,
  params: { desde?: string; hasta?: string } = {},
): Promise<Lectura[]> {
  const query = new URLSearchParams()
  if (params.desde) query.set('desde', params.desde)
  if (params.hasta) query.set('hasta', params.hasta)
  const suffix = query.toString() ? `?${query}` : ''
  return authFetch<Lectura[]>(`/pilas/${pilaId}/lecturas${suffix}`)
}
