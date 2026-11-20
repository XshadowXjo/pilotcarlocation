-- Verrous de sécurité côté base, indépendants des politiques RLS existantes.
--
-- Principe : les appels faits depuis le navigateur arrivent avec le rôle "anon" (visiteur)
-- ou "authenticated" (connecté). Les fonctions serveur utilisent "service_role" et le
-- tableau de bord Supabase "postgres" : ces deux-là ne sont pas concernés par ces verrous.
--
-- À exécuter une fois (SQL Editor de Supabase, ou `supabase db push`).

-- ─── Droits nécessaires aux fonctions serveur ────────────────────────────────
-- create-reservation lit les promotions et insère les réservations avec service_role,
-- qui n'avait pas ces droits sur ce projet.
grant select on public.promotions, public.promotion_vehicles to service_role;
grant insert on public.reservations to service_role;

-- ─── Qui est admin ? ──────────────────────────────────────────────────────────
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.user_profiles where user_id = uid), false)
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to anon, authenticated, service_role;

-- Vrai quand la requête vient du navigateur (et non d'une fonction serveur ou du tableau de bord)
create or replace function public.is_client_request()
returns boolean
language sql
stable
as $$
  select current_user in ('anon', 'authenticated')
$$;

-- ─── user_profiles : personne ne peut se donner les droits admin ─────────────
-- Pour nommer un admin : depuis le tableau de bord (SQL Editor ou Table Editor).
create or replace function public.protect_is_admin()
returns trigger
language plpgsql
as $$
begin
  if public.is_client_request() then
    if tg_op = 'INSERT' then
      new.is_admin := false;
    else
      new.is_admin := old.is_admin;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_is_admin on public.user_profiles;
create trigger protect_is_admin
  before insert or update on public.user_profiles
  for each row execute function public.protect_is_admin();

-- ─── reservations : création uniquement via la fonction create-reservation ──
-- Depuis le navigateur, seul un admin peut modifier une réservation, et seulement son statut
-- (confirmer / refuser). Prix, acompte, paiement et caution sont gérés par les fonctions serveur.
create or replace function public.protect_reservations()
returns trigger
language plpgsql
as $$
begin
  if not public.is_client_request() then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' then
    raise exception 'Les réservations doivent être créées via la fonction create-reservation'
      using errcode = '42501';
  end if;

  if not public.is_admin() then
    raise exception 'Action réservée aux administrateurs' using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' then
    if new.status not in ('pending', 'confirmed', 'cancelled') then
      raise exception 'Statut de réservation invalide' using errcode = '22023';
    end if;
    if (to_jsonb(new) - 'status' - 'updated_at') is distinct from (to_jsonb(old) - 'status' - 'updated_at') then
      raise exception 'Seul le statut peut être modifié depuis le site' using errcode = '42501';
    end if;
    return new;
  end if;

  return old; -- DELETE par un admin
end;
$$;

-- L'ancienne politique laissait n'importe qui insérer une réservation avec le prix de son choix
drop policy if exists "Anyone can create a reservation" on public.reservations;

drop trigger if exists protect_reservations on public.reservations;
create trigger protect_reservations
  before insert or update or delete on public.reservations
  for each row execute function public.protect_reservations();

-- ─── Catalogue : seuls les admins modifient véhicules, prix et promotions ────
create or replace function public.require_admin_write()
returns trigger
language plpgsql
as $$
begin
  if public.is_client_request() and not public.is_admin() then
    raise exception 'Action réservée aux administrateurs' using errcode = '42501';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists require_admin_write on public.vehicles;
create trigger require_admin_write
  before insert or update or delete on public.vehicles
  for each row execute function public.require_admin_write();

drop trigger if exists require_admin_write on public.promotions;
create trigger require_admin_write
  before insert or update or delete on public.promotions
  for each row execute function public.require_admin_write();

drop trigger if exists require_admin_write on public.promotion_vehicles;
create trigger require_admin_write
  before insert or update or delete on public.promotion_vehicles
  for each row execute function public.require_admin_write();
