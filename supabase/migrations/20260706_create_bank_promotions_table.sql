-- Migración: crea la tabla bank_promotions para el scraper de promociones
-- bancarias (Eje 5). Arranca con BAC Credomatic; el campo `bank` es texto libre
-- (no enum) para poder sumar otros bancos (BI, Industrial, Promerica) más
-- adelante sin tocar el schema.
--
-- Escritura 100% vía scraper con service role key (scripts/scrape-bank-promos.ts)
-- — no hay CMS manual para esta tabla, por eso no existe policy de
-- "authenticated can manage" como en events/editions. `image_url` apunta directo
-- al banner de la promo en el CDN de BAC (no se migra a Supabase Storage, a
-- diferencia de las fotos de lugares).

create table if not exists bank_promotions (
  id uuid primary key default gen_random_uuid(),
  bank text not null,
  external_id text not null,
  merchant_name text not null,
  place_id uuid references places(id) on delete set null,
  title text not null,
  discount_label text not null,
  discount_pct numeric,
  category text,
  terms text,
  image_url text,
  source_url text not null,
  valid_from date,
  valid_until date,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Clave natural del scraper: (bank, external_id) identifica una promo de forma
-- estable entre corridas, sin importar si el texto/imagen cambió.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bank_promotions_bank_external_id_key'
  ) then
    alter table bank_promotions
      add constraint bank_promotions_bank_external_id_key unique (bank, external_id);
  end if;
end $$;

create index if not exists idx_bank_promotions_bank on bank_promotions (bank);
create index if not exists idx_bank_promotions_place_id on bank_promotions (place_id);
create index if not exists idx_bank_promotions_active_valid on bank_promotions (is_active, valid_until);

alter table bank_promotions enable row level security;

drop policy if exists "public can read active promotions" on bank_promotions;
create policy "public can read active promotions"
  on bank_promotions for select
  using (is_active = true);
