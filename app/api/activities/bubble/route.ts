import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
        // Exact match para evitar que "Zona 1" matchee "Zona 10", "Zona 11", etc.
        query = query.eq('zone', zone);
    }

    query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });

    const { data, error } = await query.limit(60);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
}
