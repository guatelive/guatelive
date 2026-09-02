-- Migración: precios múltiples con nombre para events y activities (ej. "Nacional"
-- Q0 / "Extranjero" Q50, o "VIP"/"General"/"Niños" en un concierto). Convive con
-- price/is_free existentes — price_tiers vacío ('[]') no cambia el comportamiento
-- actual de ningún evento/actividad con precio simple. Correr en Supabase Dashboard →
-- SQL Editor.

alter table events
  add column if not exists price_tiers jsonb not null default '[]';

alter table activities
  add column if not exists price_tiers jsonb not null default '[]';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'events_price_tiers_is_array') then
    alter table events add constraint events_price_tiers_is_array
      check (jsonb_typeof(price_tiers) = 'array');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'activities_price_tiers_is_array') then
    alter table activities add constraint activities_price_tiers_is_array
      check (jsonb_typeof(price_tiers) = 'array');
  end if;
end $$;
