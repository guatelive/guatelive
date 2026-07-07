// Matching agnóstico al banco: vincula el nombre de comercio scrapeado a un
// place_id existente. A propósito solo hace match exacto de string normalizado
// (misma normalización que ya usa slugify() para slugs) — un falso positivo
// (vincular la promo al lugar equivocado) es peor que no vincular, así que no
// se agrega fuzzy matching/Levenshtein en esta primera versión.

import { slugify } from '@/lib/slug';
import type { SupabaseClient } from '@supabase/supabase-js';

export type PlaceMatchIndex = Map<string, string>;

export async function buildPlaceMatchIndex(sb: SupabaseClient): Promise<PlaceMatchIndex> {
    const { data, error } = await sb
        .from('places')
        .select('id, name')
        .eq('is_published', true);

    if (error) throw new Error(`No se pudo cargar places para matching: ${error.message}`);

    const index: PlaceMatchIndex = new Map();
    for (const place of (data ?? []) as { id: string; name: string }[]) {
        index.set(slugify(place.name), place.id);
    }
    return index;
}

export function matchPlaceByName(merchantName: string, index: PlaceMatchIndex): string | null {
    return index.get(slugify(merchantName)) ?? null;
}
