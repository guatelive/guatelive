-- Medición de favoritos sin cuenta (ADR-028). Correr en el SQL Editor de Supabase.
-- Responde: ¿la gente guarda cosas? Si sí, hay base para construir cuentas.

-- 1. Resumen: usuarios únicos que guardaron algo y ❤️ totales (últimos 30 días)
select
  count(distinct anon_id) filter (where action = 'add') as usuarios_que_guardaron,
  count(*) filter (where action = 'add')                as guardados,
  count(*) filter (where action = 'remove')             as quitados
from favorite_events
where created_at > now() - interval '30 days';

-- 2. Por tipo (lugares / eventos / actividades)
select item_type, count(*) filter (where action = 'add') as guardados, count(distinct anon_id) as usuarios
from favorite_events
group by item_type
order by guardados desc;

-- 3. Top 20 más guardados (neto: guardados - quitados)
select item_type, item_slug,
  count(*) filter (where action = 'add') - count(*) filter (where action = 'remove') as neto
from favorite_events
group by item_type, item_slug
order by neto desc
limit 20;

-- 4. Por día
select date_trunc('day', created_at)::date as dia,
  count(*) filter (where action = 'add') as guardados,
  count(distinct anon_id) as usuarios
from favorite_events
group by 1
order by 1 desc;

-- 5. Cuántos guardan más de una cosa (señal fuerte de que querrían carpetas/cuenta)
select count(*) as usuarios_con_3_o_mas
from (
  select anon_id from favorite_events where action = 'add'
  group by anon_id having count(distinct item_slug) >= 3
) t;

-- 6. Intereses del newsletter
select interes, count(*) as suscriptores
from newsletter_subscribers, unnest(interests) as interes
group by interes
order by suscriptores desc;
