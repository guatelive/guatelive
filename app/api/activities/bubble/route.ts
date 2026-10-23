import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { zonesWithin } from '@/lib/zone-hierarchy';

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get('category');
    const zone = searchParams.get('zone')?.slice(0, 100) ?? null;
    const all = searchParams.get('all') === 'true';

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let query = supabase
        .from('activities')
        .select('id, title, slug, description, category, zone, venue_name, place_id, recurrence_text, price, is_free, price_tiers, image_url, contact_link, sponsored, featured, tags')
        .eq('status', 'published');

    if (!all && category) {
        query = query.eq('category', category);
    }

    if (zone) {
        // Exact match ("Zona 1" no matchea "Zona 10") + sub-zonas (Zona 16 incluye Cayalá).
        query = query.in('zone', zonesWithin(zone));
    }

    query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });

    const { data, error } = await query.limit(60);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
}
