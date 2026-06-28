export type Lectura = {
  id: string
  sensorId: string
  temperatura: number | null
  humedad: number | null
  nitrogeno: number | null
  fosforo: number | null
  potasio: number | null
  ph: number | null
  conductividad: number | null
  oxigeno: number | null
  timestamp: string
}

export type LecturaRequest = {
  sensorId: string
  temperatura?: number
  humedad?: number
  nitrogeno?: number
  fosforo?: number
  potasio?: number
  ph?: number
  conductividad?: number
  oxigeno?: number
}

export type LecturaPage = {
  content: Lectura[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}
