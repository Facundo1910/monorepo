export type UmbralParametro =
  | 'TEMPERATURA'
  | 'HUMEDAD'
  | 'PH'
  | 'CONDUCTIVIDAD'
  | 'NITROGENO'
  | 'FOSFORO'
  | 'POTASIO'
  | 'OXIGENO'

export type UmbralNivel = 'INFO' | 'ADVERTENCIA' | 'CRITICA'

export type Umbral = {
  id: string
  pilaId: string
  parametro: UmbralParametro
  valorMin: number | null
  valorMax: number | null
  nivel: UmbralNivel
  activo: boolean
  createdAt: string
}

export type UmbralRequest = {
  parametro: UmbralParametro
  valorMin?: number
  valorMax?: number
  nivel: UmbralNivel
  activo?: boolean
}
