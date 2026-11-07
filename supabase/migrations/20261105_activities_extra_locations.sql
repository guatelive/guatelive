-- Migración: actividades con varias sedes (ej. pádel en Padel Arena: Zona 9, Cayalá y
-- Naranjo), cada una con su propio horario. Mismo enfoque que `extra_dates` en events:
-- zone/venue_name/place_id/recurrence_text siguen siendo la sede principal, y
-- `extra_locations` = sedes adicionales [{ name, zone, schedule }] — vacío ('[]') no
-- cambia nada para las actividades de una sola sede. Correr en Supabase Dashboard →
-- SQL Editor.

alter table activities
  add column if not exists extra_locations jsonb not null default '[]';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'activities_extra_locations_is_array') then
    alter table activities add constraint activities_extra_locations_is_array
      check (jsonb_typeof(extra_locations) = 'array');
  end if;
end $$;

-- Zonas de todas las sedes, para filtrar por zona sin tener que abrir el jsonb.
create or replace function public.activity_zones(main_zone text, extra jsonb)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array(
    select distinct z
    from (
      select main_zone as z
      union all
      select location ->> 'zone' from jsonb_array_elements(extra) as location
    ) as all_zones
    where z is not null and z <> ''
  );
$$;

-- Columna generada → ni el CMS ni los scripts la escriben, y nunca queda desincronizada.
alter table activities
  add column if not exists zones text[]
  generated always as (public.activity_zones(zone, extra_locations)) stored;

create index if not exists idx_activities_zones on activities using gin (zones);
