import { createBuildTimeClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/slug';

export type ZoneInfo = { zone: string; slug: string; count: number };

// Solo `places` publicados — a diferencia de /api/zones (que también cuenta events,
// para el bubble-search), una zona sin lugares generaría una página
// /zona/[zone]/restaurantes vacía, justo el tipo de página delgada que Google penaliza.
export async function getPublishedPlaceZones(): Promise<ZoneInfo[]> {
    const supabase = createBuildTimeClient();
    const { data } = await supabase
        .from('places')
        .select('zone')
        .eq('is_published', true)
        .not('zone', 'is', null);

    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
        const zone = (row.zone as string).trim();
        if (zone) counts[zone] = (counts[zone] ?? 0) + 1;
    }

    return Object.entries(counts)
        .map(([zone, count]) => ({ zone, slug: slugify(zone), count }))
        .sort((a, b) => b.count - a.count);
}
