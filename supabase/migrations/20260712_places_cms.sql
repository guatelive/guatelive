-- Migración: CMS de lugares (/admin/places).
-- Correr en Supabase Dashboard → SQL Editor.
--
-- `places` y `place_photos` nunca tuvieron RLS (docs/database.md: "sin RLS, lectura
-- pública, la app filtra is_published"). Todos los writes existentes pasan por scripts
-- con service role key, que bypasea RLS. Con el CMS escribiendo desde una sesión de
-- usuario autenticado, hace falta RLS real — mismo patrón ya usado en
-- 20260618_create_events_table.sql / 20260624_editions_cms.sql.

alter table places enable row level security;

drop policy if exists "public can read published places" on places;
create policy "public can read published places"
  on places for select
  using (is_published = true);

drop policy if exists "authenticated can manage places" on places;
create policy "authenticated can manage places"
  on places for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

alter table place_photos enable row level security;

drop policy if exists "public can read place photos" on place_photos;
create policy "public can read place photos"
  on place_photos for select
  using (true);

drop policy if exists "authenticated can manage place photos" on place_photos;
create policy "authenticated can manage place photos"
  on place_photos for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Storage: nunca existió ninguna policy para el prefijo places/ (las fotos existentes
-- se escribieron con service role key vía script, bypaseando Storage RLS también).
-- Se incluye "select" desde el día uno — sin ella, .remove() en el cliente responde sin
-- error pero borra 0 archivos (bug real ya encontrado y corregido para events/editions
-- en 20260703_storage_read_policy_fix.sql).
drop policy if exists "authenticated can read place images" on storage.objects;
create policy "authenticated can read place images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'images' and (storage.foldername(name))[1] = 'places');

drop policy if exists "authenticated can upload place images" on storage.objects;
create policy "authenticated can upload place images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'images' and (storage.foldername(name))[1] = 'places');

drop policy if exists "authenticated can update place images" on storage.objects;
create policy "authenticated can update place images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'images' and (storage.foldername(name))[1] = 'places');

drop policy if exists "authenticated can delete place images" on storage.objects;
create policy "authenticated can delete place images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'images' and (storage.foldername(name))[1] = 'places');
