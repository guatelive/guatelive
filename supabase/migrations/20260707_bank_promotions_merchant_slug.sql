-- Migración: reemplaza bank_promotions.place_id (FK a una sola sucursal) por
-- merchant_slug (nombre del comercio normalizado). Una promo bancaria aplica a
-- nivel de marca, no de sucursal específica — con place_id, cadenas con
-- múltiples sucursales (ej. Tre Fratelli, 8 sucursales) quedaban sin vincular
-- a propósito, porque el matching antiguo se negaba a adivinar cuál sucursal.
--
-- Con merchant_slug, el match se resuelve en tiempo de lectura en
-- app/lugar/[slug]/page.tsx: cada página de lugar calcula su propio nombre
-- base (sin sufijo "• Sucursal") y lo compara contra merchant_slug — así la
-- misma promo puede aparecer en todas las sucursales de una cadena, sin
-- necesidad de resolver la ambigüedad al momento de escribir la fila.
--
-- merchant_slug no se backfillea por SQL (evitar reimplementar slugify(), que
-- hace NFD + strip de acentos, en Postgres crudo) — se llena solo con la
-- próxima corrida de scripts/scrape-bank-promos.ts (upsert sobre las filas
-- existentes por bank+external_id).

alter table bank_promotions add column if not exists merchant_slug text;

create index if not exists idx_bank_promotions_merchant_slug
  on bank_promotions (merchant_slug);

drop index if exists idx_bank_promotions_place_id;

alter table bank_promotions drop column if exists place_id;
