import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ExternalLink, Star } from 'lucide-react';
import { EVENT_CATEGORY_BADGE, EVENT_CATEGORY_ICON, type EventCategory } from '@/lib/event-categories';
import { formatDateLong } from '@/lib/format-event-date';
import { SchemaMarkup } from '@/components/seo/schema-markup';
import { ShareButton } from '@/components/evento/share-button';
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
        alternates: { canonical: `https://guatelive.com/evento/${slug}` },
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
    const isFree = !event.price || event.price === 0;
    const url = `https://guatelive.com/evento/${event.slug}`;

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
        offers: {
            '@type': 'Offer',
            price: event.price ?? 0,
            priceCurrency: 'GTQ',
            ...(event.contact_link ? { url: event.contact_link } : {}),
        },
    };

    return (
        <div className="min-h-screen bg-white">
            <SchemaMarkup schema={schema} />
            <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
                <Link
                    href="/buscar"
                    className="inline-flex items-center gap-1 text-sm text-[#666666] hover:text-[#0A0A0A] mb-6 transition-colors"
                >
                    ← Explorar eventos
                </Link>

                {/* Imagen hero — una sola imagen, no la galería multi-foto de lugares */}
                <div className="relative mb-6 h-64 w-full overflow-hidden rounded-2xl bg-[#1A1A1A] sm:h-80">
                    {event.image_url ? (
                        <Image
                            src={event.image_url}
                            alt={event.title}
                            fill
                            priority
                            sizes="(max-width: 768px) 100vw, 768px"
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <PlaceholderIcon className="h-16 w-16" style={{ color: 'rgba(255,255,255,0.15)' }} />
                        </div>
                    )}
                </div>

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

                <h1 className="font-serif text-3xl font-bold text-[#0A0A0A] leading-tight mb-3">
                    {event.title}
                </h1>

                <p className="text-sm text-[#666666] mb-2">
                    {formatDateLong(event.date_start, event.date_end)}
                </p>

                <div className="mb-3">
                    {isFree ? (
                        <span className="inline-block rounded bg-[#EFF4E8] px-2.5 py-1 text-sm font-semibold text-[#3B6D11]">
                            Gratis
                        </span>
                    ) : (
                        <span className="text-xl font-bold text-[#0A0A0A]">Q{event.price}</span>
                    )}
                </div>

                <div className="flex items-center gap-1.5 text-sm text-[#666666] mb-6">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>
                        {event.places ? (
                            <Link href={`/lugar/${event.places.slug}`} className="hover:text-[#0A0A0A] hover:underline">
                                {event.places.name}
                            </Link>
                        ) : event.venue_name ? (
                            event.venue_name
                        ) : null}
                        {(event.places || event.venue_name) ? ' · ' : ''}
                        {event.zone}
                    </span>
                </div>

                {event.description && (
                    <div className="mb-6 border-t border-[#E5E5E5] pt-6">
                        <h2 className="mb-3 text-base font-semibold text-[#0A0A0A]">Sobre el evento</h2>
                        <p className="whitespace-pre-line text-sm leading-relaxed text-[#333333]">
                            {event.description}
                        </p>
                    </div>
                )}

                {event.tags.length > 0 && (
                    <div className="mb-8 flex flex-wrap gap-2">
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

                <div className="flex flex-wrap items-center gap-3 border-t border-[#E5E5E5] pt-6">
                    {event.contact_link && (
                        <a
                            href={event.contact_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-[#E11D2E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#c91827]"
                        >
                            Más información <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                    )}
                    <ShareButton url={url} title={event.title} />
                </div>
            </article>
        </div>
    );
}
