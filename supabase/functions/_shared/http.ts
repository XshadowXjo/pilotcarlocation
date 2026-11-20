import { createClient, type SupabaseClient, type User } from 'https://esm.sh/@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Erreur dont le message peut être montré tel quel au client (statut HTTP inclus)
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export function createAdminClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
}

// Utilisateur connecté, ou null si l'appel est fait avec la simple clé publique (visiteur)
export async function getOptionalUser(supabaseAdmin: SupabaseClient, req: Request): Promise<User | null> {
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  if (!token) return null
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  return error ? null : data.user
}

export async function requireUser(supabaseAdmin: SupabaseClient, req: Request): Promise<User> {
  const user = await getOptionalUser(supabaseAdmin, req)
  if (!user) throw new HttpError(401, 'Connexion requise')
  return user
}

export async function requireAdmin(supabaseAdmin: SupabaseClient, req: Request): Promise<User> {
  const user = await requireUser(supabaseAdmin, req)
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!profile?.is_admin) throw new HttpError(403, 'Accès réservé aux administrateurs')
  return user
}

export function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) return json({ error: err.message }, err.status)
  console.error(err)
  return json({ error: err instanceof Error ? err.message : 'Erreur inconnue' }, 500)
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
