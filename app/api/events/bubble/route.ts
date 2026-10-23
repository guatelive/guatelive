import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { zonesWithin } from '@/lib/zone-hierarchy';
import { guatNow } from '@/lib/hours-utils';
import { toUpcomingEvents } from '@/lib/event-showtimes';

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
        .select('id, title, slug, description, category, zone, venue_name, place_id, date_start, date_end, extra_dates, price, is_free, price_tiers, image_url, contact_link, sponsored, featured, tags')
        .eq('status', 'published')
        .gte('date_last', guatNow().toISOString());

    if (!all && category) {
        query = query.eq('category', category);
    }

    if (zone) {
        // Exact match ("Zona 1" no matchea "Zona 10") + sub-zonas (Zona 16 incluye Cayalá).
        query = query.in('zone', zonesWithin(zone));
    }

    query = query.order('date_start', { ascending: true });

    const { data, error } = await query.limit(60);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // date_start = próxima función, extra_dates = las que siguen — el filtro "¿Cuándo?"
    // del cliente (focusWhen) revisa todas.
    return NextResponse.json(toUpcomingEvents(data ?? [], guatNow()));
}
