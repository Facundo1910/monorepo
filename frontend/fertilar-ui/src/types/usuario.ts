export type UsuarioRol = 'ADMIN' | 'OPERARIO' | 'ENCARGADO'

export type UsuarioPerfil = {
  id: string
  email: string
  nombre: string
  apellido: string
  rol: UsuarioRol
  activo?: boolean
}

export type Usuario = UsuarioPerfil & {
  activo: boolean
}

export type UsuarioCreateRequest = {
  email: string
  nombre: string
  apellido: string
  rol: UsuarioRol
  contrasenaTemporal?: string
}

export type UsuarioUpdateRequest = {
  nombre: string
  apellido: string
  rol: UsuarioRol
  activo: boolean
}

export const ROL_LABEL: Record<UsuarioRol, string> = {
  ADMIN: 'administrador',
  ENCARGADO: 'encargado',
  OPERARIO: 'operario',
}
