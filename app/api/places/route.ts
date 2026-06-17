import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

type PhotoRow = { url: string; is_primary: boolean; order_index: number };

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
    const { data, error } = await supabase
        .from('places')
        .select(`
            id, slug, name, zone, rating, rating_count,
            primary_category, category,
            tags, hours, address, price_range,
            google_maps_url, phone, website, whatsapp,
            description,
            place_photos(url, is_primary, order_index)
        `)
        .eq('is_published', true)
        .order('rating', { ascending: false })
        .limit(500);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const places = (data ?? []).map((p: typeof data[number] & { place_photos: PhotoRow[] }) => {
        const { place_photos, ...rest } = p;
        return {
            ...rest,
            primary_photo_url: place_photos?.find(ph => ph.is_primary)?.url
                ?? [...(place_photos ?? [])].sort((a, b) => a.order_index - b.order_index)[0]?.url
                ?? null,
        };
    });

    return NextResponse.json(places);
}