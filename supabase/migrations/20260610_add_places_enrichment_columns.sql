-- Migración: columnas de enriquecimiento desde Google Places
-- Correr en Supabase Dashboard → SQL Editor

ALTER TABLE places
  ADD COLUMN IF NOT EXISTS business_status      TEXT,
  ADD COLUMN IF NOT EXISTS google_maps_url      TEXT,
  ADD COLUMN IF NOT EXISTS reviews_snapshot     JSONB,
  ADD COLUMN IF NOT EXISTS google_attributes    JSONB;

-- Índice útil para filtrar lugares cerrados
CREATE INDEX IF NOT EXISTS idx_places_business_status
  ON places (business_status);
