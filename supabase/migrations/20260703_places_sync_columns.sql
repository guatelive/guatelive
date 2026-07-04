-- Migración: columnas de control para el refresh por tiers de Google Places.
-- Correr en Supabase Dashboard → SQL Editor.
--
-- Anotada como SQL suelto en CLAUDE.md desde la semana 3 del proyecto, nunca se
-- versionó como migración — verificado con query de solo lectura (2026-07-03) que
-- las columnas todavía no existen en la base real.
--
-- `last_synced_at` (Basic, semanal) ya existía. Estas dos faltan para poder correr
-- los tiers --monthly (Atmosphere) y --quarterly (Contact) de scripts/refresh-places.ts.

ALTER TABLE places
  ADD COLUMN IF NOT EXISTS last_atmosphere_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_contact_synced_at TIMESTAMPTZ;
