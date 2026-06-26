export type PilaEstado = 'ACTIVA' | 'FINALIZADA' | 'PAUSADA'

export type PilaResumen = {
  id: string
  nombre: string
  estado: PilaEstado
  fechaInicio: string
  ubicacion: string | null
}

export type Pila = PilaResumen & {
  descripcion: string | null
  fechaFin: string | null
  diasEstimados: number
  humedadObjetivo: number
  temperaturaObjetivo: number
  fechaEstimadaFin: string | null
  createdAt: string
}

export type PilaRequest = {
  nombre: string
  descripcion?: string
  ubicacion?: string
  fechaInicio: string
  fechaFin?: string
  diasEstimados?: number
  humedadObjetivo?: number
  temperaturaObjetivo?: number
  estado: PilaEstado
}
