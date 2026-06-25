import type { Sensor, SensorRequest, SensorResumen } from '../types/sensor'
import { apiFetch } from './api'
import { getTokens } from './auth'

async function authFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const tokens = await getTokens()
  return apiFetch<T>(path, options, tokens?.idToken)
}

export function listSensores(): Promise<SensorResumen[]> {
  return authFetch<SensorResumen[]>('/api/sensores')
}

export function getSensor(id: string): Promise<Sensor> {
  return authFetch<Sensor>(`/api/sensores/${id}`)
}

export function listSensoresPorPila(pilaId: string): Promise<SensorResumen[]> {
  return authFetch<SensorResumen[]>(`/api/pilas/${pilaId}/sensores`)
}

export function createSensor(data: SensorRequest): Promise<Sensor> {
  return authFetch<Sensor>('/api/sensores', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateSensor(id: string, data: SensorRequest): Promise<Sensor> {
  return authFetch<Sensor>(`/api/sensores/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteSensor(id: string): Promise<void> {
  return authFetch<void>(`/api/sensores/${id}`, { method: 'DELETE' })
}
