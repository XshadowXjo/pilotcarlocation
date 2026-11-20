-- Instantané du schéma de la base Supabase (projet "PCE Project"), exporté le 2026-11-20.
--
-- C'est une RÉFÉRENCE, pas une migration : il décrit l'état réel de la base (tables,
-- contraintes, vue, fonctions, triggers, politiques RLS, buckets) pour pouvoir le relire
-- et le recréer sur un nouveau projet. Les changements futurs passent par supabase/migrations/.
-- Les droits (GRANT) par défaut de Supabase ne sont pas repris ici, sauf ceux de la migration
-- 20261119000000_securite_reservations.sql.
--
-- Pour le régénérer avec la CLI : supabase db pull

-- ─── Tables ──────────────────────────────────────────────────────────────────

create table if not exists public.contact_messages (
  id uuid not null default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text not null,
  vehicle_id uuid,
  duration text,
  message text not null,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.promotion_vehicles (
  promotion_id uuid not null,
  vehicle_id uuid not null
);

create table if not exists public.promotions (
  id uuid not null default gen_random_uuid(),
  label text not null,
  discount_type text not null,
  discount_value numeric not null,
  applies_to_all_vehicles boolean not null default false,
  start_date date not null,
  end_date date not null,
  active boolean not null default true,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.reservations (
  id uuid not null default gen_random_uuid(),
  vehicle_id uuid not null,
  first_name text not null,
  last_name text not null,
  birth_date date not null,
  phone text not null,
  email text not null,
  address text not null,
  city text not null,
  postal_code text not null,
  country text not null default 'France'::text,
  license_number text not null,
  pickup_location text not null,
  start_date date not null,
  end_date date not null,
  permis_recto_path text,
  permis_verso_path text,
  cni_recto_path text,
  cni_verso_path text,
  justificatif_path text,
  cgu_accepted boolean not null default false,
  status text not null default 'pending'::text,
  created_at timestamp with time zone not null default now(),
  user_id uuid,
  parent_reservation_id uuid,
  delivery_address text,
  delivery_price numeric,
  total_price numeric,
  deposit_due numeric,
  payment_status text not null default 'unpaid'::text,
  stripe_session_id text,
  stripe_payment_link text,
  caution_amount numeric,
  caution_method text,
  caution_status text not null default 'none'::text,
  swikly_id text,
  caution_link text
);

create table if not exists public.user_profiles (
  user_id uuid not null,
  first_name text,
  last_name text,
  birth_date date,
  phone text,
  address text,
  city text,
  postal_code text,
  country text,
  license_number text,
  permis_recto_path text,
  permis_verso_path text,
  cni_recto_path text,
  cni_verso_path text,
  justificatif_path text,
  updated_at timestamp with time zone not null default now(),
  is_admin boolean not null default false
);

create table if not exists public.vehicles (
  id uuid not null default gen_random_uuid(),
  name text not null,
  category text not null,
  image_url text,
  price_per_day numeric not null,
  power_hp integer,
  transmission text,
  fuel_type text,
  deposit_amount numeric,
  featured boolean not null default false,
  created_at timestamp with time zone not null default now(),
  options text[] default '{}'::text[],
  price_per_week numeric,
  price_three_days numeric,
  archived boolean not null default false
);

-- ─── Contraintes ─────────────────────────────────────────────────────────────

alter table public.contact_messages add constraint contact_messages_pkey PRIMARY KEY (id);
alter table public.contact_messages add constraint contact_messages_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES vehicles(id);

alter table public.promotion_vehicles add constraint promotion_vehicles_pkey PRIMARY KEY (promotion_id, vehicle_id);
alter table public.promotion_vehicles add constraint promotion_vehicles_promotion_id_fkey FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE;
alter table public.promotion_vehicles add constraint promotion_vehicles_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE;

alter table public.promotions add constraint promotions_pkey PRIMARY KEY (id);
alter table public.promotions add constraint promotions_discount_type_check CHECK ((discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text])));

alter table public.reservations add constraint reservations_pkey PRIMARY KEY (id);
alter table public.reservations add constraint reservations_parent_reservation_id_fkey FOREIGN KEY (parent_reservation_id) REFERENCES reservations(id) ON DELETE SET NULL;
alter table public.reservations add constraint reservations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
alter table public.reservations add constraint reservations_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES vehicles(id);

alter table public.user_profiles add constraint user_profiles_pkey PRIMARY KEY (user_id);
alter table public.user_profiles add constraint user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

alter table public.vehicles add constraint vehicles_pkey PRIMARY KEY (id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table public.contact_messages enable row level security;
alter table public.promotion_vehicles enable row level security;
alter table public.promotions enable row level security;
alter table public.reservations enable row level security;
alter table public.user_profiles enable row level security;
alter table public.vehicles enable row level security;

-- ─── Vue (dates prises, lisible par tous sans exposer les réservations) ──────

create or replace view public.vehicle_booked_dates as
 SELECT vehicle_id,
    start_date,
    end_date
   FROM reservations
  WHERE (status <> 'cancelled'::text);

-- ─── Fonctions et triggers (voir la migration securite_reservations) ─────────

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce((select is_admin from public.user_profiles where user_id = uid), false)
$function$;

CREATE OR REPLACE FUNCTION public.is_client_request()
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  select current_user in ('anon', 'authenticated')
$function$;

CREATE OR REPLACE FUNCTION public.protect_is_admin()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.protect_reservations()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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

  return old;
end;
$function$;

CREATE OR REPLACE FUNCTION public.require_admin_write()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if public.is_client_request() and not public.is_admin() then
    raise exception 'Action réservée aux administrateurs' using errcode = '42501';
  end if;
  return coalesce(new, old);
end;
$function$;

CREATE TRIGGER protect_is_admin BEFORE INSERT OR UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION protect_is_admin();
CREATE TRIGGER protect_reservations BEFORE INSERT OR DELETE OR UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION protect_reservations();
CREATE TRIGGER require_admin_write BEFORE INSERT OR DELETE OR UPDATE ON public.promotion_vehicles FOR EACH ROW EXECUTE FUNCTION require_admin_write();
CREATE TRIGGER require_admin_write BEFORE INSERT OR DELETE OR UPDATE ON public.promotions FOR EACH ROW EXECUTE FUNCTION require_admin_write();
CREATE TRIGGER require_admin_write BEFORE INSERT OR DELETE OR UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION require_admin_write();

-- ─── Politiques RLS : tables ─────────────────────────────────────────────────

create policy "Vehicles are viewable by everyone" on public.vehicles as permissive for select to public
  using (true);
create policy "Admins can insert vehicles" on public.vehicles as permissive for insert to authenticated
  with check ((EXISTS ( SELECT 1 FROM user_profiles WHERE ((user_profiles.user_id = auth.uid()) AND (user_profiles.is_admin = true)))));
create policy "Admins can update vehicles" on public.vehicles as permissive for update to authenticated
  using ((EXISTS ( SELECT 1 FROM user_profiles WHERE ((user_profiles.user_id = auth.uid()) AND (user_profiles.is_admin = true)))));
create policy "Admins can delete vehicles" on public.vehicles as permissive for delete to authenticated
  using ((EXISTS ( SELECT 1 FROM user_profiles WHERE ((user_profiles.user_id = auth.uid()) AND (user_profiles.is_admin = true)))));

create policy "Promotions are publicly viewable" on public.promotions as permissive for select to public
  using (true);
create policy "Admins can manage promotions" on public.promotions as permissive for all to authenticated
  using ((EXISTS ( SELECT 1 FROM user_profiles WHERE ((user_profiles.user_id = auth.uid()) AND (user_profiles.is_admin = true)))))
  with check ((EXISTS ( SELECT 1 FROM user_profiles WHERE ((user_profiles.user_id = auth.uid()) AND (user_profiles.is_admin = true)))));

create policy "Promotion vehicles are publicly viewable" on public.promotion_vehicles as permissive for select to public
  using (true);
create policy "Admins can manage promotion_vehicles" on public.promotion_vehicles as permissive for all to authenticated
  using ((EXISTS ( SELECT 1 FROM user_profiles WHERE ((user_profiles.user_id = auth.uid()) AND (user_profiles.is_admin = true)))))
  with check ((EXISTS ( SELECT 1 FROM user_profiles WHERE ((user_profiles.user_id = auth.uid()) AND (user_profiles.is_admin = true)))));

create policy "Users can view their own reservations" on public.reservations as permissive for select to authenticated
  using ((auth.uid() = user_id));
create policy "Admins can view all reservations" on public.reservations as permissive for select to authenticated
  using ((EXISTS ( SELECT 1 FROM user_profiles WHERE ((user_profiles.user_id = auth.uid()) AND (user_profiles.is_admin = true)))));
create policy "Admins can update reservations" on public.reservations as permissive for update to authenticated
  using ((EXISTS ( SELECT 1 FROM user_profiles WHERE ((user_profiles.user_id = auth.uid()) AND (user_profiles.is_admin = true)))));

create policy "Users can view their own profile" on public.user_profiles as permissive for select to authenticated
  using ((auth.uid() = user_id));
create policy "Users can insert their own profile" on public.user_profiles as permissive for insert to authenticated
  with check ((auth.uid() = user_id));
create policy "Users can update their own profile" on public.user_profiles as permissive for update to authenticated
  using ((auth.uid() = user_id));

create policy "Anyone can send a contact message" on public.contact_messages as permissive for insert to public
  with check (true);
create policy "Admins can view contact messages" on public.contact_messages as permissive for select to authenticated
  using ((EXISTS ( SELECT 1 FROM user_profiles WHERE ((user_profiles.user_id = auth.uid()) AND (user_profiles.is_admin = true)))));

-- ─── Stockage : buckets et politiques ────────────────────────────────────────

insert into storage.buckets (id, name, public) values ('reservation-documents', 'reservation-documents', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('vehicle-images', 'vehicle-images', true) on conflict (id) do nothing;

create policy "Anyone can upload reservation documents" on storage.objects as permissive for insert to public
  with check ((bucket_id = 'reservation-documents'::text));
create policy "Admins can read reservation documents" on storage.objects as permissive for select to authenticated
  using (((bucket_id = 'reservation-documents'::text) AND (EXISTS ( SELECT 1 FROM user_profiles WHERE ((user_profiles.user_id = auth.uid()) AND (user_profiles.is_admin = true))))));

create policy "Vehicle images are publicly viewable" on storage.objects as permissive for select to public
  using ((bucket_id = 'vehicle-images'::text));
create policy "Admins can upload vehicle images" on storage.objects as permissive for insert to authenticated
  with check (((bucket_id = 'vehicle-images'::text) AND (EXISTS ( SELECT 1 FROM user_profiles WHERE ((user_profiles.user_id = auth.uid()) AND (user_profiles.is_admin = true))))));
create policy "Admins can delete vehicle images" on storage.objects as permissive for delete to authenticated
  using (((bucket_id = 'vehicle-images'::text) AND (EXISTS ( SELECT 1 FROM user_profiles WHERE ((user_profiles.user_id = auth.uid()) AND (user_profiles.is_admin = true))))));
