-- Migración: actividades con más de una categoría (ej. caminata al Cerro de la Cruz:
-- Aventura y Naturaleza + Deportes). `category` sigue siendo la principal (badge de la
-- card, color, ícono); `extra_categories` = las demás, vacío no cambia nada. Correr en
-- Supabase Dashboard → SQL Editor.

alter table activities
  add column if not exists extra_categories text[] not null default '{}';

-- Todas las categorías, para filtrar. Columna generada → ni el CMS ni los scripts la
-- escriben, y nunca queda desincronizada.
alter table activities
  add column if not exists categories text[]
  generated always as (array_prepend(category, extra_categories)) stored;

create index if not exists idx_activities_categories on activities using gin (categories);
