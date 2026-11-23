import { corsHeaders, json, errorResponse, createAdminClient, requireAdmin } from '../_shared/http.ts'

// Supprime les pièces d'identité dont on n'a plus besoin (RGPD) :
//  - celles des locations terminées depuis plus de RETENTION_DAYS jours ;
//  - les fichiers orphelins (envoyés pendant une réservation abandonnée) de plus de 2 jours.
// Un fichier encore utilisé par une réservation plus récente n'est jamais supprimé.
// { dryRun: true } compte sans rien supprimer.
//
// Appel : par un admin depuis le site, ou automatiquement avec la clé service_role.

const BUCKET = 'reservation-documents'
const RETENTION_DAYS = Number(Deno.env.get('DOCUMENT_RETENTION_DAYS') ?? 90)
const ORPHAN_GRACE_DAYS = 2
const DOCUMENT_COLUMNS = ['permis_recto_path', 'permis_verso_path', 'cni_recto_path', 'cni_verso_path', 'justificatif_path']
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabaseAdmin = createAdminClient()

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

function pathsOf(row: Record<string, string | null>): string[] {
  return DOCUMENT_COLUMNS.map((column) => row[column]).filter((path): path is string => !!path)
}

// Tous les fichiers du bucket, rangés par dossier (un dossier par véhicule)
async function listStoredFiles(): Promise<{ path: string; createdAt: Date }[]> {
  const files: { path: string; createdAt: Date }[] = []
  const { data: folders, error } = await supabaseAdmin.storage.from(BUCKET).list('', { limit: 1000 })
  if (error) throw new Error(`Lecture du stockage impossible : ${error.message}`)

  for (const folder of folders ?? []) {
    if (folder.id) continue // fichier à la racine : ignoré, le site n'en crée pas
    for (let offset = 0; ; offset += 1000) {
      const { data: page, error: pageError } = await supabaseAdmin.storage
        .from(BUCKET)
        .list(folder.name, { limit: 1000, offset })
      if (pageError) throw new Error(`Lecture du stockage impossible : ${pageError.message}`)
      for (const file of page ?? []) {
        // Fichiers techniques (.emptyFolderPlaceholder) ignorés.
        // Date inconnue : considéré comme récent, donc jamais supprimé
        if (file.id && !file.name.startsWith('.')) files.push({ path: `${folder.name}/${file.name}`, createdAt: file.created_at ? new Date(file.created_at) : new Date() })
      }
      if (!page || page.length < 1000) break
    }
  }
  return files
}

async function isAuthorized(req: Request): Promise<void> {
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  if (token && token === SERVICE_ROLE_KEY) return
  await requireAdmin(supabaseAdmin, req)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    await isAuthorized(req)
    const { dryRun = false } = await req.json().catch(() => ({}))

    const cutoff = daysAgo(RETENTION_DAYS).toISOString().slice(0, 10)
    const { data: reservations, error } = await supabaseAdmin
      .from('reservations')
      .select('end_date, permis_recto_path, permis_verso_path, cni_recto_path, cni_verso_path, justificatif_path')
    if (error) throw new Error(`Lecture des réservations impossible : ${error.message}`)

    // Fichiers à garder : ceux des réservations encore récentes
    const keep = new Set<string>()
    const expired = new Set<string>()
    for (const row of reservations ?? []) {
      const target = row.end_date < cutoff ? expired : keep
      for (const path of pathsOf(row)) target.add(path)
    }

    const stored = await listStoredFiles()
    const orphanLimit = daysAgo(ORPHAN_GRACE_DAYS)
    const referenced = new Set([...keep, ...expired])

    const toDelete = new Set<string>([...expired].filter((path) => !keep.has(path)))
    let orphans = 0
    for (const file of stored) {
      if (!referenced.has(file.path) && file.createdAt < orphanLimit) {
        toDelete.add(file.path)
        orphans++
      }
    }

    const paths = [...toDelete]
    const summary = {
      retentionDays: RETENTION_DAYS,
      expiredFiles: paths.length - orphans,
      orphanFiles: orphans,
      total: paths.length,
    }
    if (dryRun || paths.length === 0) return json({ dryRun: true, ...summary })

    for (let i = 0; i < paths.length; i += 100) {
      const { error: removeError } = await supabaseAdmin.storage.from(BUCKET).remove(paths.slice(i, i + 100))
      if (removeError) throw new Error(`Suppression des fichiers impossible : ${removeError.message}`)
    }

    // Les chemins effacés ne doivent plus apparaître ni sur les réservations, ni dans les profils
    for (const table of ['reservations', 'user_profiles']) {
      for (const column of DOCUMENT_COLUMNS) {
        for (let i = 0; i < paths.length; i += 100) {
          const { error: updateError } = await supabaseAdmin
            .from(table)
            .update({ [column]: null })
            .in(column, paths.slice(i, i + 100))
          if (updateError) throw new Error(`Mise à jour de ${table} impossible : ${updateError.message}`)
        }
      }
    }

    return json({ dryRun: false, ...summary })
  } catch (err) {
    return errorResponse(err)
  }
})
