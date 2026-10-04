-- Migración: eventos con varias funciones (ej. obra de teatro con 4 funciones en
-- distintas fechas). Solo cambia fecha/hora entre funciones — venue, precios y link de
-- tickets son los mismos para todas (ver ADR-026 en docs/decisions.md).
-- Correr en Supabase Dashboard → SQL Editor.
--
-- `date_start` sigue siendo la PRIMERA función. `extra_dates` = funciones adicionales,
-- siempre guardadas ordenadas asc y > date_start (lo garantiza la server action de
-- app/admin/events/actions.ts, no la DB). Mismo tipo que date_start: la columna real es
-- `timestamp` sin zona (hora de pared de Guatemala), no `timestamptz`.

alter table events
  add column if not exists extra_dates timestamp[] not null default '{}';

-- Última función del evento. Columna generada → ni el CMS ni el scraper la escriben, y
-- nunca queda desincronizada. greatest() ignora NULL: para eventos de una sola fecha
-- (extra_dates vacío) date_last = date_start, así que no hace falta backfill.
-- Los listados públicos filtran por date_last >= ahora en vez de date_start, para que un
-- evento siga visible mientras le quede alguna función futura.
alter table events
  add column if not exists date_last timestamp
  generated always as (greatest(date_start, extra_dates[array_upper(extra_dates, 1)])) stored;

create index if not exists idx_events_status_date_last on events (status, date_last);
