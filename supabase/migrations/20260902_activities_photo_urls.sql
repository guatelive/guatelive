-- Migración: agrega `photo_urls` a `activities` para el carrusel de fotos de
-- `/actividad/[slug]` (mismo comportamiento visual que la galería de `places`, ver
-- docs/decisions.md ADR-024). `image_url` se mantiene como portada/cover sin cambios
-- (cards, home, metadata, JSON-LD siguen usándolo); `photo_urls` son fotos adicionales
-- que solo se muestran en el carrusel del detalle.
--
-- De paso corrige un bug latente: `20260819_create_activities_table.sql` le dio a
-- `authenticated` policies de insert/update/delete sobre storage.objects para el
-- prefijo `activities/`, pero nunca de select — mismo bug ya arreglado para
-- `editions/` y `events/` en `20260703_storage_read_policy_fix.sql` ("sin policy de
-- select, `.remove()` no borra nada y tampoco tira error"). Correr en Supabase
-- Dashboard → SQL Editor.

alter table activities
  add column if not exists photo_urls text[] not null default '{}';

drop policy if exists "authenticated can read activity images" on storage.objects;
create policy "authenticated can read activity images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'images' and (storage.foldername(name))[1] = 'activities');
