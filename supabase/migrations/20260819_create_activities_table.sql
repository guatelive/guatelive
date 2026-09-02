-- Migración: crea la tabla `activities` (planes evergreen — sin date_start real,
-- ej. visita a museo, clase de yoga gratis recurrente, caminata en sendero público),
-- separada de `events` (siempre tiene date_start puntual). Decisión de arquitectura
-- tomada en sesión 2026-07-09 (ver docs/historial-sesiones.md) y re-confirmada
-- 2026-08-19: extender `events` ensuciaría 5+ call sites que filtran
-- `.gte('date_start', ...)`, el índice compuesto, y el JSON-LD de Event (siempre
-- exige startDate). Ver ADR-023 en docs/decisions.md. Correr en Supabase Dashboard →
-- SQL Editor.

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  category text not null,
  zone text not null,
  venue_name text,
  place_id uuid references places(id) on delete set null,
  recurrence_text text,
  price numeric,
  is_free boolean not null default false,
  image_url text,
  contact_link text,
  sponsored boolean not null default false,
  featured boolean not null default false,
  tags text[] not null default '{}',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'activities_status_check') then
    alter table activities add constraint activities_status_check check (status in ('pending', 'published'));
  end if;
end $$;

create index if not exists idx_activities_status on activities (status);
create index if not exists idx_activities_tags on activities using gin (tags);
create index if not exists idx_activities_place_id on activities (place_id);

alter table activities enable row level security;

drop policy if exists "public can read published activities" on activities;
create policy "public can read published activities"
  on activities for select
  using (status = 'published');

drop policy if exists "authenticated can manage activities" on activities;
create policy "authenticated can manage activities"
  on activities for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Reusa el bucket "images" existente bajo el prefijo activities/, igual que events/.
drop policy if exists "authenticated can upload activity images" on storage.objects;
create policy "authenticated can upload activity images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'images' and (storage.foldername(name))[1] = 'activities');

drop policy if exists "authenticated can update activity images" on storage.objects;
create policy "authenticated can update activity images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'images' and (storage.foldername(name))[1] = 'activities');

drop policy if exists "authenticated can delete activity images" on storage.objects;
create policy "authenticated can delete activity images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'images' and (storage.foldername(name))[1] = 'activities');
