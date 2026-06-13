import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
    const { data: places, error } = await supabase
        .from('places')
        .select(`
            id, slug, name, zone, rating, rating_count,
            primary_category, category, photo_reference,
            tags, hours, address, price_range,
            google_maps_url, phone, website, whatsapp,
            description
        `)
        .eq('is_published', true)
        .order('rating', { ascending: false })
        .limit(500);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(places);
}