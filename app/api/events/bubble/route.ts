import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { guatNow } from '@/lib/hours-utils';

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
        .from('events')
        .select('id, title, slug, description, category, zone, venue_name, place_id, date_start, date_end, price, is_free, image_url, contact_link, sponsored, featured, tags')
        .eq('status', 'published')
        .gte('date_start', guatNow().toISOString());

    if (!all && category) {
        query = query.eq('category', category);
    }

    if (zone) {
        // Exact match para evitar que "Zona 1" matchee "Zona 10", "Zona 11", etc.
        query = query.eq('zone', zone);
    }

    query = query.order('date_start', { ascending: true });

    const { data, error } = await query.limit(60);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
}
