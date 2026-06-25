export type SensorResumen = {
  id: string
  pilaId: string
  codigo: string
  tipo: string
  activo: boolean
}

export type Sensor = SensorResumen & {
  descripcion: string | null
  createdAt: string
  updatedAt: string
}

export type SensorRequest = {
  pilaId: string
  codigo: string
  tipo: string
  descripcion?: string
  activo: boolean
}
