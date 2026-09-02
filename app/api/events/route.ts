import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { guatNow } from '@/lib/hours-utils';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
    const { data, error } = await supabase
        .from('events')
        .select(`
            id, title, slug, description, category, zone, venue_name,
            place_id, date_start, date_end, price, is_free, price_tiers, image_url, contact_link,
            sponsored, featured, tags
        `)
        .eq('status', 'published')
        .gte('date_start', guatNow().toISOString())
        .order('date_start', { ascending: true })
        .limit(500);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
}
