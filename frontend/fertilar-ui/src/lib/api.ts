const API_URL = import.meta.env.VITE_API_URL as string

export async function syncUsuario(idToken: string): Promise<void> {
  try {
    await fetch(`${API_URL}/api/usuarios/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    })
  } catch (err) {
    console.error('[API] Error al sincronizar usuario:', err)
  }
}
