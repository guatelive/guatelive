import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { guatNow } from '@/lib/hours-utils';
import { toUpcomingEvents } from '@/lib/event-showtimes';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
    const { data, error } = await supabase
        .from('events')
        .select(`
            id, title, slug, description, category, zone, venue_name,
            place_id, date_start, date_end, extra_dates, price, is_free, price_tiers, image_url, contact_link,
            sponsored, featured, tags
        `)
        .eq('status', 'published')
        .gte('date_last', guatNow().toISOString())
        .order('date_start', { ascending: true })
        .limit(500);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // date_start = próxima función (no la primera), orden por próxima función.
    return NextResponse.json(toUpcomingEvents(data ?? [], guatNow()));
}
