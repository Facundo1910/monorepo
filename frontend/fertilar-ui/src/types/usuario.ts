export type UsuarioRol = 'ADMIN' | 'OPERARIO' | 'ENCARGADO'

export type UsuarioPerfil = {
  id: string
  email: string
  nombre: string
  apellido: string
  rol: UsuarioRol
}
