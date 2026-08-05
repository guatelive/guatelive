// Banco de fotos libres (sin copyright) por categoría, para eventos scrapeados sin
// imagen propia — ver ADR-020/021 en docs/decisions.md: nunca se hotlinkea la imagen
// de la fuente original.
//
// CÓMO AGREGAR FOTOS: cada entrada es { url, credit } — `credit` es el nombre del
// autor/sitio (Unsplash/Pexels/Pixabay), útil para trazabilidad aunque esas
// plataformas no exigan atribución visible. Solo fotos confirmadas de bancos
// realmente libres para uso comercial sin atribución obligatoria. Las listas están
// vacías a propósito — hasta que se llenen, `pickEventPhoto()` devuelve `null` y
// `image_url` queda sin imagen (mismo comportamiento que hoy).
//
// Rotación: determinística por `externalId` (hash simple) — el mismo evento siempre
// muestra la misma foto entre corridas del scraper, pero eventos distintos de la
// misma categoría reparten entre todo el pool en vez de mostrar siempre la primera.

import type { EventCategory } from '@/lib/event-categories';

type StockPhoto = { url: string; credit: string };

const PHOTO_POOLS: Record<EventCategory, StockPhoto[]> = {
    'Música': [],
    'Deportes': [],
    'Cultura': [],
    'Talleres': [],
    'Familiar': [],
    'Gastronomía': [],
    'Vida Nocturna': [],
    'Aventura y Naturaleza': [],
    'Otros': [],
};

function hashToIndex(externalId: string, length: number): number {
    let hash = 0;
    for (let i = 0; i < externalId.length; i++) {
        hash = (hash * 31 + externalId.charCodeAt(i)) >>> 0;
    }
    return hash % length;
}

export function pickEventPhoto(category: EventCategory, externalId: string): string | null {
    const pool = PHOTO_POOLS[category];
    if (!pool || pool.length === 0) return null;
    return pool[hashToIndex(externalId, pool.length)].url;
}
