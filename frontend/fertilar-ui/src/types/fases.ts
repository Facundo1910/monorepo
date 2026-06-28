export type FaseMesofila = {
  completada: boolean
  descripcion: string
  temperaturaMax: number | null
}

export type FaseTermofila = {
  completada: boolean
  descripcion: string
  diasSobre55: number | null
}

export type FaseEnfriamiento = {
  completada: boolean
  descripcion: string
  temperaturaActual: number | null
}

export type FaseMaduracion = {
  completada: boolean
  descripcion: string
  diasRestantes: number | null
}

export type PilaFases = {
  pilaId: string
  diasTranscurridos: number
  diasEstimados: number
  fases: {
    mesofila: FaseMesofila
    termofila: FaseTermofila
    enfriamiento: FaseEnfriamiento
    maduracion: FaseMaduracion
  }
  aptoParaCertificar: boolean
  motivoNoCertificable: string | null
}
