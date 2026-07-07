import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type PhotoRow = { url: string; is_primary: boolean; order_index: number };

type PlaceRow = {
    id: string;
    slug: string;
    name: string;
    zone: string | null;
    rating: number | null;
    rating_count: number | null;
    primary_category: string | null;
    tags: string[] | null;
    hours: unknown;
    place_photos: PhotoRow[];
};

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const tagsParam = searchParams.get('tags');
    const zone = searchParams.get('zone')?.slice(0, 100) ?? null;
    // 'surprise' desactivado a propósito (era random shuffle sin IA real, ver CLAUDE.md
    // sesión 2026-07-05) — pendiente de rehacer con Claude API cuando haya presupuesto.
    // preload=true: skip zone filter (client handles it) and return bigger pool
    const preload = searchParams.get('preload') === 'true';

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let query = supabase
        .from('places')
        .select('id, slug, name, zone, rating, rating_count, primary_category, tags, hours, place_photos(url, is_primary, order_index)')
        .eq('is_published', true);

    if (tagsParam) {
        const tags = tagsParam.split(',').filter(Boolean);
        if (tags.length > 0) {
            query = query.overlaps('tags', tags);
        }
    }

    if (zone && !preload) {
        // Exact match para evitar que "Zona 1" matchee "Zona 10", "Zona 11", etc.
        query = query.eq('zone', zone);
    }

    query = query.order('rating', { ascending: false });

    const limit = preload ? 60 : 12;
    const { data, error } = await query.limit(limit);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data ?? []) as PlaceRow[];

    const result = rows.map(({ place_photos, ...rest }) => ({
        ...rest,
        primary_photo_url: place_photos?.find(p => p.is_primary)?.url
            ?? [...(place_photos ?? [])].sort((a, b) => a.order_index - b.order_index)[0]?.url
            ?? null,
    }));

    return NextResponse.json(result);
}
