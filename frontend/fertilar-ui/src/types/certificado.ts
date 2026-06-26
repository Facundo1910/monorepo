export type Certificado = {
  id: string
  pilaId: string
  pilaNombre: string
  usuarioId: string
  usuarioNombre: string
  numero: string
  fechaEmision: string
  urlDocumento: string
  observaciones: string | null
  temperaturaPromedio: number | null
  humedadPromedio: number | null
  phPromedio: number | null
  createdAt: string
}

export type CertificadoRequest = {
  observaciones?: string
}
