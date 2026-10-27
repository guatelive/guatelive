import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { guatNow } from '@/lib/hours-utils';
import { toUpcomingEvents } from '@/lib/event-showtimes';

type PhotoRow = { url: string; is_primary: boolean; order_index: number };

const MAX_PER_TYPE = 50;

function slugs(param: string | null): string[] {
    return (param ?? '').split(',').map(s => s.trim()).filter(Boolean).slice(0, MAX_PER_TYPE);
}

// Devuelve los datos de card de los favoritos guardados en el navegador (/favoritos).
// Solo publicados: un lugar despublicado (cerrado) o un evento que ya pasó no aparece.
// GET /api/favorites?place=a,b&event=c&activity=d
export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const placeSlugs = slugs(searchParams.get('place'));
    const eventSlugs = slugs(searchParams.get('event'));
    const activitySlugs = slugs(searchParams.get('activity'));

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    const [places, events, activities] = await Promise.all([
        placeSlugs.length === 0 ? { data: [], error: null } : supabase
            .from('places')
            .select('id, slug, name, zone, rating, rating_count, primary_category, category, tags, place_photos(url, is_primary, order_index)')
            .eq('is_published', true)
            .in('slug', placeSlugs),
        eventSlugs.length === 0 ? { data: [], error: null } : supabase
            .from('events')
            .select('id, title, slug, description, category, zone, venue_name, place_id, date_start, date_end, extra_dates, price, is_free, price_tiers, image_url, contact_link, sponsored, featured, tags, status')
            .eq('status', 'published')
            .gte('date_last', guatNow().toISOString())
            .in('slug', eventSlugs),
        activitySlugs.length === 0 ? { data: [], error: null } : supabase
            .from('activities')
            .select('id, title, slug, description, category, zone, venue_name, place_id, recurrence_text, price, is_free, price_tiers, image_url, contact_link, sponsored, featured, tags, status')
            .eq('status', 'published')
            .in('slug', activitySlugs),
    ]);

    const error = places.error ?? events.error ?? activities.error;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const placeRows = (places.data ?? []).map(p => {
        const { place_photos, ...rest } = p as typeof p & { place_photos: PhotoRow[] };
        const photos = place_photos ?? [];
        return {
            ...rest,
            primary_photo_url: photos.find(ph => ph.is_primary)?.url
                ?? [...photos].sort((a, b) => a.order_index - b.order_index)[0]?.url
                ?? null,
        };
    });

    return NextResponse.json(
        {
            places: placeRows,
            events: toUpcomingEvents(events.data ?? [], guatNow()),
            activities: activities.data ?? [],
        },
        { headers: { 'Cache-Control': 'no-store' } }
    );
}
