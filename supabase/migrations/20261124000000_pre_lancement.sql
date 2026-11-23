-- Préparation à la mise en ligne.

-- ─── Messages de contact ─────────────────────────────────────────────────────
-- Ils passent désormais par la fonction send-contact-message, qui les enregistre et
-- prévient l'agence par e-mail. L'admin les lit et les supprime depuis le site.
drop policy if exists "Anyone can send a contact message" on public.contact_messages;

grant select, insert, delete on public.contact_messages to service_role;
grant delete on public.contact_messages to authenticated;

drop policy if exists "Admins can delete contact messages" on public.contact_messages;
create policy "Admins can delete contact messages" on public.contact_messages
  as permissive for delete to authenticated
  using ((select public.is_admin()));

-- ─── Fichiers envoyés ────────────────────────────────────────────────────────
-- Pièces d'identité : images ou PDF, 10 Mo maximum. Photos de véhicules : images, 5 Mo.
update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']
where id = 'reservation-documents';

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
where id = 'vehicle-images';

-- ─── Purge des pièces d'identité (fonction purge-documents) ──────────────────
-- Elle efface les chemins des documents supprimés sur les réservations et les profils.
grant update on public.user_profiles to service_role;
