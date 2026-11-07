-- Migración: crea `plans` + `plan_items` — combinaciones curadas de lugares, eventos y
-- actividades para una ocasión ("Champions a la hora del almuerzo", "Girls night").
-- Contenido editorial: no tiene organizador ni entradas (no es un evento) ni es un
-- lugar permanente (no es una actividad).
--
-- kind = 'ocasion' → tiene starts_at/ends_at y deja de listarse al pasar ends_at.
-- kind = 'siempre' → sin fechas, no vence.
--
-- starts_at/ends_at son `timestamp` sin zona (hora de pared de Guatemala), igual que
-- events.date_start — se comparan contra guatNow() en la app (lib/hours-utils.ts).
--
-- RLS: el público lee los planes publicados AUNQUE estén vencidos. La vigencia la
-- filtra la app en /planes y en el home; la ficha /planes/[slug] de un plan vencido
-- tiene que poder leerlo para mostrar "Este plan ya pasó" sin romper links viejos de
-- Instagram (decisión de Fredy 2026-11-04).
--
-- Correr en Supabase Dashboard → SQL Editor.

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  intro_text text,
  cover_image_url text,
  kind text not null,
  starts_at timestamp,
  ends_at timestamp,
  theme_tags text[] not null default '{}',
  status text not null default 'draft',
  sponsored boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint plans_kind_check check (kind in ('ocasion', 'siempre')),
  constraint plans_status_check check (status in ('draft', 'published', 'archived')),
  constraint plans_slug_check check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint plans_dates_check check (
    (kind = 'ocasion' and starts_at is not null and ends_at is not null and ends_at > starts_at)
    or (kind = 'siempre' and starts_at is null and ends_at is null)
  )
);

create index if not exists idx_plans_status_ends_at on plans (status, ends_at);

create table if not exists plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans(id) on delete cascade,
  order_index integer not null default 0,
  item_type text not null,
  -- cascade y no set null: con set null la fila violaría plan_items_ref_check. Si se
  -- borra el lugar/evento/actividad, el item desaparece del plan.
  place_id uuid references places(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  activity_id uuid references activities(id) on delete cascade,
  custom_title text,
  custom_subtitle text,
  label text,
  editorial_note text,
  sponsored boolean not null default false,
  created_at timestamptz not null default now(),
  constraint plan_items_type_check check (item_type in ('place', 'event', 'activity', 'custom')),
  constraint plan_items_ref_check check (
    (item_type = 'place' and place_id is not null and event_id is null and activity_id is null)
    or (item_type = 'event' and event_id is not null and place_id is null and activity_id is null)
    or (item_type = 'activity' and activity_id is not null and place_id is null and event_id is null)
    or (item_type = 'custom' and place_id is null and event_id is null and activity_id is null
        and custom_title is not null and btrim(custom_title) <> '')
  )
);

create index if not exists idx_plan_items_plan_order on plan_items (plan_id, order_index);
create index if not exists idx_plan_items_place_id on plan_items (place_id);
create index if not exists idx_plan_items_event_id on plan_items (event_id);
create index if not exists idx_plan_items_activity_id on plan_items (activity_id);

alter table plans enable row level security;

drop policy if exists "public can read published plans" on plans;
create policy "public can read published plans"
  on plans for select
  using (status = 'published');

drop policy if exists "authenticated can manage plans" on plans;
create policy "authenticated can manage plans"
  on plans for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

alter table plan_items enable row level security;

-- Mismo criterio que edition_places: un item de un borrador no se filtra antes de tiempo.
-- Lo que el item referencia (place/event/activity) sigue con su propio RLS — si no está
-- publicado, el join devuelve null y la app lo omite.
drop policy if exists "public can read items of published plans" on plan_items;
create policy "public can read items of published plans"
  on plan_items for select
  using (
    exists (
      select 1 from plans p
      where p.id = plan_items.plan_id
        and p.status = 'published'
    )
  );

drop policy if exists "authenticated can manage plan_items" on plan_items;
create policy "authenticated can manage plan_items"
  on plan_items for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Portadas en el bucket "images" bajo plans/. Incluye la policy de select desde el
-- arranque — sin ella `.remove()` no borra nada y no tira error (ver
-- 20260703_storage_read_policy_fix.sql y 20260902_activities_photo_urls.sql).
drop policy if exists "authenticated can read plan images" on storage.objects;
create policy "authenticated can read plan images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'images' and (storage.foldername(name))[1] = 'plans');

drop policy if exists "authenticated can upload plan images" on storage.objects;
create policy "authenticated can upload plan images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'images' and (storage.foldername(name))[1] = 'plans');

drop policy if exists "authenticated can update plan images" on storage.objects;
create policy "authenticated can update plan images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'images' and (storage.foldername(name))[1] = 'plans');

drop policy if exists "authenticated can delete plan images" on storage.objects;
create policy "authenticated can delete plan images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'images' and (storage.foldername(name))[1] = 'plans');
