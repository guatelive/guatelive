-- Migración: precios opcionales que no son la entrada (ej. IRTRA: brazalete y boletos
-- para juegos). `price_tiers` sigue siendo la entrada y define el "Desde" de las cards;
-- `extra_prices` solo se lista en el detalle. Vacío no cambia nada. Correr en Supabase
-- Dashboard → SQL Editor.

alter table activities
  add column if not exists extra_prices jsonb not null default '[]'
  constraint activities_extra_prices_is_array check (jsonb_typeof(extra_prices) = 'array');
