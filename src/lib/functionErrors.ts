// Récupère le vrai message d'erreur renvoyé par une fonction serveur
export async function functionErrorMessage(error: unknown, fallback = 'Une erreur est survenue.'): Promise<string> {
  const err = error as { message?: string; context?: Response }
  if (err?.context && typeof err.context.json === 'function') {
    try {
      const body = await err.context.json()
      if (body?.error) return body.error
    } catch {
      // on garde le message générique
    }
  }
  return err?.message ?? fallback
}