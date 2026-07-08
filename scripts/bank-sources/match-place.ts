// Herramienta de reporte para --dry: indica si el nombre de un comercio
// scrapeado coincide con el nombre de al menos un lugar publicado — mismo
// criterio de prefijo que lib/promo-place-match.ts (slug completo igual, o
// slug completo empieza con "merchant_slug-", para cubrir sucursales tipo
// "Tre Fratelli Zona 14" o "Tre Fratelli • Cayalá" por igual). Ya NO decide
// qué place_id persistir — bank_promotions.merchant_slug se guarda tal cual
// (ver scrape-bank-promos.ts) y el match real se resuelve en tiempo de
// lectura en app/lugar/[slug]/page.tsx y lib/promo-place-match.ts.
//
// A propósito solo hace match exacto/prefijo de string normalizado
// (slugify()) — un falso positivo sería peor que no reportarlo, así que no
// hay fuzzy matching/Levenshtein.

import { slugify } from '@/lib/slug';
import type { SupabaseClient } from '@supabase/supabase-js';

export type PlaceMatchIndex = string[];

export async function buildPlaceMatchIndex(sb: SupabaseClient): Promise<PlaceMatchIndex> {
    const { data, error } = await sb
        .from('places')
        .select('name')
        .eq('is_published', true);

    if (error) throw new Error(`No se pudo cargar places para matching: ${error.message}`);

    return ((data ?? []) as { name: string }[]).map((place) => slugify(place.name));
}

export function matchPlaceByName(merchantName: string, index: PlaceMatchIndex): boolean {
    const merchantSlug = slugify(merchantName);
    return index.some((placeSlug) => placeSlug === merchantSlug || placeSlug.startsWith(`${merchantSlug}-`));
}
