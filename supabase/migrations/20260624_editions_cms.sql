-- Migración: CMS de ediciones editoriales — RLS + storage policies + summary_items
-- Correr en Supabase Dashboard → SQL Editor.
--
-- Hoy "editions"/"edition_places" no tienen RLS habilitado (solo se escribían desde
-- scripts con la service role key). El CMS escribe desde sesiones de usuario
-- autenticado, así que hay que habilitar RLS y agregar políticas — mismo patrón que
-- ya existe para "events" (ver 20260618_create_events_table.sql).

alter table editions
  add column if not exists summary_items jsonb not null default '[]';

alter table editions enable row level security;

drop policy if exists "public can read published editions" on editions;
create policy "public can read published editions"
  on editions for select
  using (status = 'published');

drop policy if exists "authenticated can manage editions" on editions;
create policy "authenticated can manage editions"
  on editions for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

alter table edition_places enable row level security;

-- Lectura pública solo si la edición padre está publicada — un lugar mencionado en
-- un borrador no debe filtrarse antes de tiempo.
drop policy if exists "public can read edition_places of published editions" on edition_places;
create policy "public can read edition_places of published editions"
  on edition_places for select
  using (
    exists (
      select 1 from editions e
      where e.id = edition_places.edition_id
        and e.status = 'published'
    )
  );

drop policy if exists "authenticated can manage edition_places" on edition_places;
create policy "authenticated can manage edition_places"
  on edition_places for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Permite subir/editar/borrar imágenes de ediciones en el bucket "images" ya existente,
-- bajo el prefijo editions/. El bucket ya es público para lectura.
drop policy if exists "authenticated can upload edition images" on storage.objects;
create policy "authenticated can upload edition images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'images' and (storage.foldername(name))[1] = 'editions');

drop policy if exists "authenticated can update edition images" on storage.objects;
create policy "authenticated can update edition images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'images' and (storage.foldername(name))[1] = 'editions');

drop policy if exists "authenticated can delete edition images" on storage.objects;
create policy "authenticated can delete edition images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'images' and (storage.foldername(name))[1] = 'editions');
