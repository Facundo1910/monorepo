export type AlertaNivel = 'INFO' | 'ADVERTENCIA' | 'CRITICA'

export type Alerta = {
  id: string
  pilaId: string
  lecturaId: string
  tipo: string
  mensaje: string
  nivel: AlertaNivel
  resuelta: boolean
  createdAt: string
}

export type AlertaResolverResponse = {
  id: string
  resuelta: boolean
  resolvedAt: string
}
