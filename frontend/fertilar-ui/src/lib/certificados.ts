import type { Certificado, CertificadoRequest } from '../types/certificado'
import { apiFetch } from './api'
import { getTokens } from './auth'

async function authFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const tokens = await getTokens()
  return apiFetch<T>(path, options, tokens?.idToken)
}

export function listCertificadosPorPila(pilaId: string): Promise<Certificado[]> {
  return authFetch<Certificado[]>(`/pilas/${pilaId}/certificados`)
}

export function emitirCertificado(
  pilaId: string,
  data: CertificadoRequest = {},
): Promise<Certificado> {
  return authFetch<Certificado>(`/pilas/${pilaId}/certificados`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function deleteCertificado(id: string): Promise<void> {
  return authFetch<void>(`/certificados/${id}`, { method: 'DELETE' })
}
