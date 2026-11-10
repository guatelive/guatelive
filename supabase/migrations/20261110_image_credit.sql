-- Migración: crédito de la foto en eventos y actividades — texto libre que se muestra
-- debajo de la imagen en /evento/[slug] y /actividad/[slug] (ej. "eticket.gt",
-- "Instagram @irtra_gt"). En actividades cubre portada + galería. Null = no se muestra
-- nada. Las fotos de Ediciones son propias y no llevan crédito. Correr en Supabase
-- Dashboard → SQL Editor.

alter table events add column if not exists image_credit text;
alter table activities add column if not exists image_credit text;
