-- Migración: ajustes a la tabla events (ya existía, creada a mano para el
-- carrousel) + RLS + storage policies para imágenes de eventos.
-- Correr en Supabase Dashboard → SQL Editor.
--
-- Schema real de "events" al momento de escribir esto: id, title, slug, description,
-- category, zone, venue_name, place_id, date_start, date_end, price, image_url,
-- contact_link, source, status (default 'pending'), sponsored, featured, created_at,
-- published_at. Lo único que faltaba era `tags`.

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique
);

alter table events
  add column if not exists tags text[] not null default '{}';

-- Status: la tabla ya usaba 'pending' como default (no 'draft') — el código del CMS
-- se alineó a esa convención. Agregamos el check ahora que sabemos qué valores
-- escribe la app (no existía ningún check antes).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'events_status_check') then
    alter table events add constraint events_status_check check (status in ('pending', 'published'));
  end if;
end $$;

-- FK de place_id ya existía pero sin "on delete set null" — bloqueaba el borrado de
-- un lugar si tenía algún evento enlazado. La recreamos para que el evento sobreviva
-- (con place_id en null) en vez de bloquear el borrado.
alter table events drop constraint if exists events_place_id_fkey;
alter table events add constraint events_place_id_fkey
  foreign key (place_id) references places(id) on delete set null;

create index if not exists idx_events_status_date on events (status, date_start);
create index if not exists idx_events_tags on events using gin (tags);
create index if not exists idx_events_place_id on events (place_id);

alter table events enable row level security;

drop policy if exists "public can read published events" on events;
create policy "public can read published events"
  on events for select
  using (status = 'published');

drop policy if exists "authenticated can manage events" on events;
create policy "authenticated can manage events"
  on events for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Permite subir/editar/borrar imágenes de eventos en el bucket "images" ya existente,
-- bajo el prefijo events/. El bucket ya es público para lectura.
drop policy if exists "authenticated can upload event images" on storage.objects;
create policy "authenticated can upload event images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'images' and (storage.foldername(name))[1] = 'events');

drop policy if exists "authenticated can update event images" on storage.objects;
create policy "authenticated can update event images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'images' and (storage.foldername(name))[1] = 'events');

drop policy if exists "authenticated can delete event images" on storage.objects;
create policy "authenticated can delete event images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'images' and (storage.foldername(name))[1] = 'events');
