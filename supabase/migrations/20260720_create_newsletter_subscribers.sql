-- Migración: crea newsletter_subscribers para el signup del Home.
--
-- Primera tabla del proyecto con escritura pública anónima (ver ADR-017 en
-- docs/decisions.md). No hay policy de select/update/delete para `anon` ni
-- `authenticated` a propósito: la anon key es pública en el bundle del
-- browser, así que sin esta restricción cualquiera podría leer la lista
-- completa de emails desde la consola. Solo se puede insertar, nunca leer de
-- vuelta por este camino.
--
-- La policy de insert cubre `anon` Y `authenticated`: /login usa Supabase
-- Auth real (signInWithPassword en app/login/actions.ts), no un password
-- middleware plano como decía la doc vieja — un admin logueado que visita el
-- home tiene una sesión `authenticated`, y también tiene que poder suscribirse.

create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table newsletter_subscribers enable row level security;

drop policy if exists "anon can subscribe" on newsletter_subscribers;
drop policy if exists "anyone can subscribe" on newsletter_subscribers;
create policy "anyone can subscribe"
  on newsletter_subscribers for insert
  to anon, authenticated
  with check (true);
