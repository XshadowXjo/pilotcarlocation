import { useEffect, useState } from 'react'
import { purgeDocuments, type PurgeResult } from '../../services/supabase/adminActions'
import { Button } from '@/components/ui/button'

// Suppression des pièces d'identité devenues inutiles (obligation RGPD)
export default function DocumentsPurgePanel() {
  const [preview, setPreview] = useState<PurgeResult | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isWorking, setIsWorking] = useState(false)

  const refresh = () => {
    purgeDocuments(true)
      .then(setPreview)
      .catch((err) => setMessage(err instanceof Error ? err.message : 'Erreur inconnue'))
  }

  useEffect(refresh, [])

  const handlePurge = async () => {
    if (!preview || preview.total === 0) return
    if (!confirm(`Supprimer définitivement ${preview.total} document(s) ? Cette action est irréversible.`)) return
    setIsWorking(true)
    setMessage(null)
    try {
      const result = await purgeDocuments(false)
      setMessage(`${result.total} document(s) supprimé(s) ✓`)
      refresh()
    } catch (err) {
      setMessage(`Échec : ${err instanceof Error ? err.message : 'erreur inconnue'}`)
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
      <div>
        <p className="text-sm font-semibold">Pièces d'identité</p>
        <p className="text-xs text-muted-foreground">
          {preview
            ? preview.total === 0
              ? `Aucun document à supprimer (conservation : ${preview.retentionDays} jours après la fin de la location).`
              : `${preview.expiredFiles} document(s) de locations terminées depuis plus de ${preview.retentionDays} jours` +
                (preview.orphanFiles ? ` et ${preview.orphanFiles} fichier(s) de réservations abandonnées` : '') +
                ' peuvent être supprimés.'
            : 'Vérification...'}
        </p>
        {message && <p className="mt-1 text-xs text-primary">{message}</p>}
      </div>
      <Button variant="outline" onClick={handlePurge} disabled={isWorking || !preview || preview.total === 0}>
        {isWorking ? 'Suppression...' : 'Supprimer'}
      </Button>
    </div>
  )
}
