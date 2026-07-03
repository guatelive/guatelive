import { createClient } from '@/lib/supabase/server';
import { SchemaMarkup } from '@/components/seo/schema-markup';
import { EventGridClient } from '@/components/eventos-hoy/event-grid-client';
import { eventMatchesWhen } from '@/lib/event-when';
import { guatNow } from '@/lib/hours-utils';
import type { DbEvent } from '@/lib/types';

export const revalidate = 3600;

export const metadata = {
    title: 'Eventos hoy en Guatemala | GuateLive',
    description: 'Qué hacer hoy en Guatemala: conciertos, talleres, ferias y planes del día, actualizados a diario.',
    alternates: { canonical: 'https://guatelive.com/eventos/hoy' },
};

export default async function EventosHoyPage() {
    const supabase = await createClient();
    const { data } = await supabase
        .from('events')
        .select(`
            id, title, slug, description, category, zone, venue_name,
            place_id, date_start, date_end, price, is_free, image_url, contact_link,
            sponsored, featured, tags, status
        `)
        .eq('status', 'published')
        .gte('date_start', guatNow().toISOString())
        .order('date_start', { ascending: true })
        .limit(60);

    const allEvents = (data ?? []) as DbEvent[];
    const now = guatNow();
    const todayEvents = allEvents.filter(e => eventMatchesWhen(e.date_start, 'today', now));
    const showingToday = todayEvents.length > 0;
    const events = showingToday ? todayEvents : allEvents.slice(0, 12);

    const itemListSchema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: events.map((event, i) => {
            const priceUnknown = !event.is_free && event.price === null;
            return {
                '@type': 'ListItem',
                position: i + 1,
                item: {
                    '@type': 'Event',
                    name: event.title,
                    startDate: event.date_start,
                    ...(event.date_end ? { endDate: event.date_end } : {}),
                    eventStatus: 'https://schema.org/EventScheduled',
                    location: {
                        '@type': 'Place',
                        name: event.venue_name || event.zone,
                        address: event.zone,
                    },
                    ...(event.image_url ? { image: event.image_url } : {}),
                    ...(event.description ? { description: event.description } : {}),
                    // Si no sabemos el precio, no inventamos un 0 — se omite offers.
                    ...(priceUnknown ? {} : {
                        offers: {
                            '@type': 'Offer',
                            price: event.is_free ? 0 : event.price,
                            priceCurrency: 'GTQ',
                            ...(event.contact_link ? { url: event.contact_link } : {}),
                        },
                    }),
                },
            };
        }),
    };

    return (
        <div className="mx-auto max-w-6xl px-6 py-10">
            <SchemaMarkup schema={itemListSchema} />

            <h1 className="font-serif text-3xl font-bold text-[#0A0A0A] mb-2">
                Eventos hoy en Guatemala
            </h1>
            <p className="text-sm text-[#666666] mb-8">
                {showingToday
                    ? `${events.length} evento${events.length !== 1 ? 's' : ''} confirmado${events.length !== 1 ? 's' : ''} para hoy.`
                    : 'No hay eventos confirmados para hoy todavía — estos son los próximos.'}
            </p>

            {events.length > 0 ? (
                <EventGridClient events={events} />
            ) : (
                <p className="text-center text-sm text-[#666666] py-12">
                    Todavía no hay eventos publicados. Volvé pronto.
                </p>
            )}
        </div>
    );
}
