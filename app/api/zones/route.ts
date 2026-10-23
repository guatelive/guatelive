import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { guatNow } from '@/lib/hours-utils';
import { rollUpZoneCounts } from '@/lib/zone-hierarchy';

type ZoneRow = { zone: string | null };

// Sin parámetros: todas las zonas con algo publicado (places + events + activities).
// Con `kind`: solo las zonas que tienen resultados para el plan elegido en la búsqueda
// del home — mismos filtros que /api/places/bubble, /api/events/bubble y
// /api/activities/bubble — para no ofrecer zonas que después den 0 resultados.
//   kind=place&tags=para-trabajar,laptop-friendly
//   kind=event&category=Música      (all=true = cualquier categoría)
//   kind=activity&category=Cultura
export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const kind = searchParams.get('kind');
    const tags = (searchParams.get('tags') ?? '').split(',').filter(Boolean);
    const category = searchParams.get('category');
    const all = searchParams.get('all') === 'true';

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Cada fuente devuelve sus filas ya resueltas (un array de builders de distintas
    // tablas hace explotar la inferencia de tipos de supabase-js).
    async function placeZones(): Promise<ZoneRow[]> {
        let q = supabase.from('places').select('zone').eq('is_published', true).not('zone', 'is', null);
        if (tags.length > 0) q = q.overlaps('tags', tags);
        const { data, error } = await q;
        if (error) throw error;
        return data ?? [];
    }
    async function eventZones(): Promise<ZoneRow[]> {
        let q = supabase.from('events').select('zone').eq('status', 'published').not('zone', 'is', null);
        if (kind === 'event') {
            q = q.gte('date_last', guatNow().toISOString());
            if (!all && category) q = q.eq('category', category);
        }
        const { data, error } = await q;
        if (error) throw error;
        return data ?? [];
    }
    async function activityZones(): Promise<ZoneRow[]> {
        let q = supabase.from('activities').select('zone').eq('status', 'published').not('zone', 'is', null);
        if (kind === 'activity' && !all && category) q = q.eq('category', category);
        const { data, error } = await q;
        if (error) throw error;
        return data ?? [];
    }

    let rows: ZoneRow[];
    try {
        const sources = kind === 'place' ? [placeZones()]
            : kind === 'event' ? [eventZones()]
            : kind === 'activity' ? [activityZones()]
            : [placeZones(), eventZones(), activityZones()];
        rows = (await Promise.all(sources)).flat();
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error consultando zonas';
        return NextResponse.json({ error: message }, { status: 500 });
    }

    const counts: Record<string, number> = {};
    for (const row of rows) {
        const z = row.zone?.trim();
        if (z) counts[z] = (counts[z] ?? 0) + 1;
    }

    const zones = Object.entries(rollUpZoneCounts(counts))
        .sort((a, b) => b[1] - a[1])
        .map(([zone, count]) => ({ zone, count }));

    return NextResponse.json(zones, {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
}
