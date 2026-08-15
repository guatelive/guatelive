-- Habilita el scraper de eventos (fuentes públicas, ver scripts/scrape-events.ts):
-- agrega `external_id` para poder deduplicar por (source, external_id), igual que
-- ya hace bank_promotions con (bank, external_id).

alter table events
  add column if not exists external_id text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'events_source_external_id_key'
  ) then
    alter table events
      add constraint events_source_external_id_key unique (source, external_id);
  end if;
end $$;
