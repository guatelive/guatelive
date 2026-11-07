-- Migración: fechas para ordenar los listados del admin por recién publicados y recién
-- editados. Correr en Supabase Dashboard → SQL Editor.

-- events no tenía updated_at. Lo escribe la server action de app/admin/events/actions.ts
-- (igual que activities), no un trigger: así un scraper que actualiza un evento no lo
-- hace pasar por "editado". Backfill con created_at para no marcar todo como editado hoy.
alter table events add column if not exists updated_at timestamptz;
update events set updated_at = created_at where updated_at is null;
alter table events alter column updated_at set default now();
alter table events alter column updated_at set not null;

-- places no tenía published_at. Con trigger, no desde la server action, porque también
-- se publican lugares por script. La fecha real de publicación de los lugares existentes
-- no se guardó nunca: created_at es la mejor aproximación. El trigger de updated_at se
-- apaga durante el backfill para que no marque los 379 lugares como editados hoy.
alter table places add column if not exists published_at timestamptz;

alter table places disable trigger places_updated_at;
update places set published_at = created_at where is_published and published_at is null;
alter table places enable trigger places_updated_at;

create or replace function public.places_set_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not new.is_published then
    new.published_at := null;
  elsif tg_op = 'INSERT' or not old.is_published then
    new.published_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists places_published_at on places;
create trigger places_published_at
  before insert or update of is_published on places
  for each row execute function public.places_set_published_at();
