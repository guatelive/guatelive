-- Migración: desactiva las promos de Promerica (186 filas, last_seen_at congelado
-- en 2026-07-11). Promerica se descartó definitivamente como fuente (ADR-019,
-- actualización 2026-08-14: el robots.txt nuevo de clubpromerica.com bloquea
-- bots de IA), así que estas promos nunca se van a re-verificar y no deben
-- seguir visibles en /promos, el home ni las fichas de lugar.
--
-- Se desactivan, no se borran: quedan como histórico por si algún día hay un
-- acuerdo directo con Promerica o una fuente permitida. Todas las queries
-- públicas ya filtran por is_active = true.

update bank_promotions
set is_active = false,
    updated_at = now()
where bank = 'promerica'
  and is_active = true;
