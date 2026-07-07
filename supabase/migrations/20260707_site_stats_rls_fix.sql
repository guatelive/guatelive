-- Fix de seguridad: Supabase marcó site_stats como "RLS Disabled in Public"
-- (crítico) — la tabla se creó a mano fuera de la carpeta de migraciones (junto
-- con el contador de visitas) y nunca tuvo RLS habilitado. PostgREST expone
-- todas las tablas de public vía su API REST automática sin importar cómo la
-- use la app — sin RLS, cualquiera con la clave anon (pública, viaja en el
-- navegador) podría leer/escribir esta tabla directo por HTTP.
--
-- site_stats SOLO se consulta desde app/api/stats/route.ts, siempre con
-- SUPABASE_SERVICE_ROLE_KEY (server-side) — nunca con la clave anon. El
-- service role bypasea RLS por diseño, así que no hace falta ninguna policy
-- permisiva: se habilita RLS sin políticas, lo que bloquea todo acceso público
-- por default sin cambiar el comportamiento de la app.

alter table site_stats enable row level security;
