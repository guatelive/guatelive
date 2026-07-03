-- Migración: distinguir "es gratis" de "no sé el precio" en events.
-- Correr en Supabase Dashboard → SQL Editor.
--
-- Antes, price = null se interpretaba en todo el sitio (home, /evento/[slug],
-- JSON-LD Schema.org) como "Gratis". No había forma de cargar un evento sin
-- saber el precio sin que se mostrara como gratuito.

alter table events
  add column if not exists is_free boolean not null default false;

-- Pendiente manual (no se puede automatizar sin criterio humano): revisar los
-- eventos existentes con price is null y marcar is_free = true los que el
-- founder sepa que sí son gratis. Ejemplo:
-- update events set is_free = true where price is null and id in (...);
