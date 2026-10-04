import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ImageWithSkeleton } from '@/components/ui/image-with-skeleton';
import { MapPin, ExternalLink, Star, CalendarDays, Clock, Ticket } from 'lucide-react';
import { EVENT_CATEGORY_BADGE, EVENT_CATEGORY_ICON, type EventCategory } from '@/lib/event-categories';
import { formatDateParts } from '@/lib/format-event-date';
import { DetailInfoCard, priceRowContent, type InfoRow } from '@/components/detail-info-card';
import { SchemaMarkup } from '@/components/seo/schema-markup';
import { Breadcrumb } from '@/components/breadcrumb';
import { buildBreadcrumbSchema } from '@/lib/schema-builders';
import { ShareButton } from '@/components/evento/share-button';
import { SITE_URL } from '@/lib/site-config';
import type { DbEvent } from '@/lib/types';

export const revalidate = 3600;

type Params = Promise<{ slug: string }>;

type EventWithPlace = DbEvent & { places: { name: string; slug: string } | null };

function createSb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export async function generateStaticParams() {
    const supabase = createSb();
    const { data } = await supabase.from('events').select('slug').eq('status', 'published');
    return (data ?? []).map(({ slug }: { slug: string }) => ({ slug }));
}

export async function generateMetadata(props: { params: Params }) {
    const { slug } = await props.params;
    const supabase = createSb();
    const { data: event } = await supabase
        .from('events')
        .select('title, description, category, zone, image_url')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

    if (!event) return { title: 'Evento no encontrado' };

    const description = event.description ?? `${event.category} en ${event.zone} — GuateLive`;

    return {
        title: `${event.title} — GuateLive`,
        description,
        alternates: { canonical: `${SITE_URL}/evento/${slug}` },
        openGraph: {
            title: event.title,
            description,
            images: event.image_url ? [{ url: event.image_url }] : [],
            type: 'website',
        },
    };
}

export default async function EventoPage(props: { params: Params }) {
    const { slug } = await props.params;
    const supabase = createSb();

    const { data } = await supabase
        .from('events')
        .select('*, places(name, slug)')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

    if (!data) notFound();

    const event = data as EventWithPlace;
    const colors = EVENT_CATEGORY_BADGE[event.category as EventCategory] ?? EVENT_CATEGORY_BADGE['Otros'];
    const PlaceholderIcon = EVENT_CATEGORY_ICON[event.category as EventCategory] ?? Star;
    const isFree = event.is_free;
    const priceUnknown = !isFree && event.price === null && event.price_tiers.length === 0;
    const hasPriceTiers = event.price_tiers.length > 0;
    const { date: dateLabel, time: timeLabel } = formatDateParts(event.date_start, event.date_end);
    const priceContent = priceRowContent(event);
    const infoRows: InfoRow[] = [
        { icon: CalendarDays, label: 'Fecha', content: dateLabel },
        { icon: Clock, label: 'Hora', content: timeLabel },
        {
            icon: MapPin,
            label: 'Lugar',
            content: (
                <>
                    {event.places ? (
                        <Link href={`/lugar/${event.places.slug}`} className="font-medium hover:underline">
                            {event.places.name}
                        </Link>
                    ) : event.venue_name ? (
                        <span className="font-medium">{event.venue_name}</span>
                    ) : null}
                    <span className="block text-[#666666]">{event.zone}</span>
                </>
            ),
        },
        ...(priceContent ? [{ icon: Ticket, label: hasPriceTiers ? 'Precios' : 'Precio', content: priceContent }] : []),
    ];
    const url = `${SITE_URL}/evento/${event.slug}`;

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: event.title,
        startDate: event.date_start,
        ...(event.date_end ? { endDate: event.date_end } : {}),
        eventStatus: 'https://schema.org/EventScheduled',
        location: {
            '@type': 'Place',
            name: event.places?.name || event.venue_name || event.zone,
            address: event.zone,
        },
        ...(event.image_url ? { image: event.image_url } : {}),
        ...(event.description ? { description: event.description } : {}),
        // Si no sabemos el precio, no inventamos un 0 — se omite el bloque offers.
        // Con precios múltiples, un Offer por tier es más correcto que inventar un
        // único precio "desde".
        ...(priceUnknown ? {} : {
            offers: hasPriceTiers
                ? event.price_tiers.map(tier => ({
                    '@type': 'Offer',
                    name: tier.label,
                    price: tier.price,
                    priceCurrency: 'GTQ',
                    ...(event.contact_link ? { url: event.contact_link } : {}),
                }))
                : {
                    '@type': 'Offer',
                    price: isFree ? 0 : event.price,
                    priceCurrency: 'GTQ',
                    ...(event.contact_link ? { url: event.contact_link } : {}),
                },
        }),
    };

    // Sin BreadcrumbList antes: esta página usa `@type: Event` como schema principal
    // (offers, startDate, etc.) — se suma el breadcrumb como schema aparte, mismo
    // patrón que /actividad/[slug], para tener el mismo componente visual sitewide.
    const breadcrumbItems = [
        { name: 'Inicio', url: SITE_URL },
        { name: 'Eventos', url: `${SITE_URL}/eventos/hoy` },
        { name: event.title, url },
    ];
    const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems);

    return (
        <div className="min-h-screen bg-white">
            <SchemaMarkup schema={[schema, breadcrumbSchema]} />
            <article className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
                <Breadcrumb items={breadcrumbItems} className="mb-6" />

                {/* Imagen hero — una sola imagen, no la galería multi-foto de lugares */}
                <div className="relative mb-8 h-64 w-full overflow-hidden rounded-2xl bg-[#1A1A1A] sm:h-80 lg:h-[440px]">
                    {event.image_url ? (
                        <ImageWithSkeleton
                            src={event.image_url}
                            alt={event.title}
                            fill
                            priority
                            sizes="(max-width: 1152px) 100vw, 1152px"
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <PlaceholderIcon className="h-16 w-16" style={{ color: 'rgba(255,255,255,0.15)' }} />
                        </div>
                    )}
                </div>

                {/* Desktop: contenido a la izquierda, ficha sticky a la derecha.
                    Mobile: título → ficha → descripción, apilado. */}
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-x-12 lg:gap-y-8">
                    <header className="lg:col-start-1 lg:row-start-1">
                        {/* Badges */}
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span
                                className="rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-wide"
                                style={{ backgroundColor: colors.bg, color: colors.fg }}
                            >
                                {event.category}
                            </span>
                            {event.featured && (
                                <span className="rounded bg-[#FBEFD8] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-[#8A5A00]">
                                    Destacado
                                </span>
                            )}
                            {event.sponsored && (
                                <span className="rounded bg-[#E11D2E] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                                    Patrocinado
                                </span>
                            )}
                        </div>

                        <h1 className="font-serif text-3xl font-bold leading-tight text-[#0A0A0A] lg:text-5xl">
                            {event.title}
                        </h1>
                    </header>

                    <aside className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
                        <div className="lg:sticky lg:top-24">
                            <DetailInfoCard
                                rows={infoRows}
                                footer={
                                    <>
                                        {event.contact_link && (
                                            <a
                                                href={event.contact_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#E11D2E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#c91827]"
                                            >
                                                Más información <ExternalLink className="h-3.5 w-3.5" />
                                            </a>
                                        )}
                                        <ShareButton
                                            url={url}
                                            title={event.title}
                                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E5E5E5] px-6 py-3 text-sm font-semibold text-[#0A0A0A] hover:bg-[#FAFAFA]"
                                        />
                                    </>
                                }
                            />
                        </div>
                    </aside>

                    <div className="lg:col-start-1 lg:row-start-2">
                        {event.description && (
                            <section className="mb-6">
                                <h2 className="mb-3 font-serif text-xl font-bold text-[#0A0A0A]">Sobre el evento</h2>
                                <p className="whitespace-pre-line text-[15px] leading-7 text-[#333333]">
                                    {event.description}
                                </p>
                            </section>
                        )}

                        {event.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {event.tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="rounded-full border border-[#E5E5E5] px-3 py-1 text-xs text-[#666666]"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </article>
        </div>
    );
}
