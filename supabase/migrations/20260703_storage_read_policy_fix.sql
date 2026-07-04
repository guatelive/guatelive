-- Fix: falta política de SELECT en storage.objects para editions/ y events/.
-- Correr en Supabase Dashboard → SQL Editor.
--
-- Bug real detectado en sesión 2026-07-03: borrar/reemplazar una edición dejaba las
-- fotos huérfanas en Storage (el borrado no tiraba error, pero tampoco borraba nada).
--
-- Causa: 20260624_editions_cms.sql y 20260618_create_events_table.sql le dan a un
-- usuario autenticado permiso de insert/update/delete sobre storage.objects, pero
-- nunca de select. El bucket "images" está marcado público, así que las fotos se ven
-- bien por URL directa (ese camino no pasa por RLS) — pero `.remove()` en el cliente
-- sí pasa por RLS, y Supabase Storage necesita "ver" la fila (select) antes de poder
-- borrarla. Sin esa policy, `.remove()` responde sin error pero borra 0 archivos.

drop policy if exists "authenticated can read edition images" on storage.objects;
create policy "authenticated can read edition images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'images' and (storage.foldername(name))[1] = 'editions');

drop policy if exists "authenticated can read event images" on storage.objects;
create policy "authenticated can read event images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'images' and (storage.foldername(name))[1] = 'events');
