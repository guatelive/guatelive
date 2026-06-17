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
    const surprise = searchParams.get('surprise') === 'true';

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let query = supabase
        .from('places')
        .select('id, slug, name, zone, rating, rating_count, primary_category, tags, hours, place_photos(url, is_primary, order_index)')
        .eq('is_published', true);

    if (surprise) {
        query = query.gte('rating', 4.3);
    } else if (tagsParam) {
        const tags = tagsParam.split(',').filter(Boolean);
        if (tags.length > 0) {
            query = query.overlaps('tags', tags);
        }
    }

    if (zone) {
        // Exact match para evitar que "Zona 1" matchee "Zona 10", "Zona 11", etc.
        query = query.eq('zone', zone);
    }

    if (!surprise) {
        query = query.order('rating', { ascending: false });
    }

    const { data, error } = await query.limit(surprise ? 60 : 12);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let rows = (data ?? []) as PlaceRow[];

    if (surprise) {
        rows = rows.sort(() => Math.random() - 0.5).slice(0, 12);
    }

    const result = rows.map(({ place_photos, ...rest }) => ({
        ...rest,
        primary_photo_url: place_photos?.find(p => p.is_primary)?.url
            ?? [...(place_photos ?? [])].sort((a, b) => a.order_index - b.order_index)[0]?.url
            ?? null,
    }));

    return NextResponse.json(result);
}
