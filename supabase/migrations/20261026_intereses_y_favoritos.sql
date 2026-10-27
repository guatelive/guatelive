-- Migración: intereses del newsletter + log anónimo de favoritos (2026-10-26).
--
-- 1) newsletter_subscribers.interests: lo que el suscriptor eligió en "¿Qué te
--    interesa?" del form del home. Valores fijos, validados en el server action
--    (lib/newsletter-interests.ts). Sigue sin policy de select/update para anon:
--    la unión de intereses de un email ya suscrito la hace el server action con
--    service role.
--
-- 2) favorite_events: un registro por cada ❤️ / quitar ❤️ (los favoritos en sí
--    viven en el localStorage del navegador, no hay cuentas). Sirve para medir si
--    la gente guarda cosas (decide si se construyen cuentas, ver ADR-028). Mismo
--    patrón insert-only que newsletter_subscribers (ADR-017): la anon key es
--    pública, así que nadie puede leer este log desde el browser.

alter table newsletter_subscribers
  add column if not exists interests text[] not null default '{}';

create table if not exists favorite_events (
  id uuid primary key default gen_random_uuid(),
  anon_id uuid not null,
  item_type text not null check (item_type in ('place', 'event', 'activity')),
  item_slug text not null check (char_length(item_slug) between 1 and 200),
  action text not null check (action in ('add', 'remove')),
  created_at timestamptz not null default now()
);

create index if not exists favorite_events_item_idx on favorite_events (item_type, item_slug);
create index if not exists favorite_events_anon_idx on favorite_events (anon_id);

alter table favorite_events enable row level security;

drop policy if exists "anyone can log favorites" on favorite_events;
create policy "anyone can log favorites"
  on favorite_events for insert
  to anon, authenticated
  with check (true);
