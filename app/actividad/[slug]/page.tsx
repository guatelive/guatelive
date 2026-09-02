import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ImageWithSkeleton } from '@/components/ui/image-with-skeleton';
import { MapPin, ExternalLink, Star } from 'lucide-react';
import { EVENT_CATEGORY_BADGE, EVENT_CATEGORY_ICON, type EventCategory } from '@/lib/event-categories';
import { SchemaMarkup } from '@/components/seo/schema-markup';
import { buildBreadcrumbSchema } from '@/lib/schema-builders';
import { ShareButton } from '@/components/evento/share-button';
import { SITE_URL } from '@/lib/site-config';
import { priceDisplay } from '@/lib/event-display';
import type { DbActivity } from '@/lib/types';

export const revalidate = 3600;

type Params = Promise<{ slug: string }>;

type ActivityWithPlace = DbActivity & { places: { name: string; slug: string } | null };

function createSb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export async function generateStaticParams() {
    const supabase = createSb();
    const { data } = await supabase.from('activities').select('slug').eq('status', 'published');
    return (data ?? []).map(({ slug }: { slug: string }) => ({ slug }));
}

export async function generateMetadata(props: { params: Params }) {
    const { slug } = await props.params;
    const supabase = createSb();
    const { data: activity } = await supabase
        .from('activities')
        .select('title, description, category, zone, image_url')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

    if (!activity) return { title: 'Actividad no encontrada' };

    const description = activity.description ?? `${activity.category} en ${activity.zone} — GuateLive`;

    return {
        title: `${activity.title} — GuateLive`,
        description,
        alternates: { canonical: `${SITE_URL}/actividad/${slug}` },
        openGraph: {
            title: activity.title,
            description,
            images: activity.image_url ? [{ url: activity.image_url }] : [],
            type: 'website',
        },
    };
}

export default async function ActividadPage(props: { params: Params }) {
    const { slug } = await props.params;
    const supabase = createSb();

    const { data } = await supabase
        .from('activities')
        .select('*, places(name, slug)')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

    if (!data) notFound();

    const activity = data as ActivityWithPlace;
    const colors = EVENT_CATEGORY_BADGE[activity.category as EventCategory] ?? EVENT_CATEGORY_BADGE['Otros'];
    const PlaceholderIcon = EVENT_CATEGORY_ICON[activity.category as EventCategory] ?? Star;
    const price = priceDisplay(activity);
    const url = `${SITE_URL}/actividad/${activity.slug}`;

    // Sin `@type: Event` acá — una actividad evergreen no tiene startDate real, y
    // schema.org lo exige para Event. BreadcrumbList no fabrica nada. Ver ADR-023.
    const breadcrumbSchema = buildBreadcrumbSchema([
        { name: 'Inicio', url: SITE_URL },
        { name: 'Actividades', url: `${SITE_URL}/actividades` },
        { name: activity.title, url },
    ]);

    return (
        <div className="min-h-screen bg-white">
            <SchemaMarkup schema={breadcrumbSchema} />
            <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
                <div className="mb-6 flex items-center gap-4">
                    <Link
                        href="/actividades"
                        className="inline-flex items-center gap-1 text-sm text-[#666666] hover:text-[#0A0A0A] transition-colors"
                    >
                        ← Seguir explorando
                    </Link>
                </div>

                {/* Imagen hero — una sola imagen, no la galería multi-foto de lugares */}
                <div className="relative mb-6 h-64 w-full overflow-hidden rounded-2xl bg-[#1A1A1A] sm:h-80">
                    {activity.image_url ? (
                        <ImageWithSkeleton
                            src={activity.image_url}
                            alt={activity.title}
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
                        {activity.category}
                    </span>
                    {activity.featured && (
                        <span className="rounded bg-[#FBEFD8] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-[#8A5A00]">
                            Destacado
                        </span>
                    )}
                    {activity.sponsored && (
                        <span className="rounded bg-[#E11D2E] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                            Patrocinado
                        </span>
                    )}
                </div>

                <h1 className="font-serif text-3xl font-bold text-[#0A0A0A] leading-tight mb-3">
                    {activity.title}
                </h1>

                {activity.recurrence_text && (
                    <p className="text-sm text-[#666666] mb-2">
                        {activity.recurrence_text}
                    </p>
                )}

                <div className="mb-3">
                    {price.kind === 'free' ? (
                        <span className="inline-block rounded bg-[#EFF4E8] px-2.5 py-1 text-sm font-semibold text-[#3B6D11]">
                            Gratis
                        </span>
                    ) : price.kind === 'priced' ? (
                        <span className="text-xl font-bold text-[#0A0A0A]">{price.label}</span>
                    ) : null}
                </div>

                <div className="flex items-center gap-1.5 text-sm text-[#666666] mb-6">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>
                        {activity.places ? (
                            <Link href={`/lugar/${activity.places.slug}`} className="hover:text-[#0A0A0A] hover:underline">
                                {activity.places.name}
                            </Link>
                        ) : activity.venue_name ? (
                            activity.venue_name
                        ) : null}
                        {(activity.places || activity.venue_name) ? ' · ' : ''}
                        {activity.zone}
                    </span>
                </div>

                {activity.description && (
                    <div className="mb-6 border-t border-[#E5E5E5] pt-6">
                        <h2 className="mb-3 text-base font-semibold text-[#0A0A0A]">Sobre la actividad</h2>
                        <p className="whitespace-pre-line text-sm leading-relaxed text-[#333333]">
                            {activity.description}
                        </p>
                    </div>
                )}

                {activity.tags.length > 0 && (
                    <div className="mb-8 flex flex-wrap gap-2">
                        {activity.tags.map(tag => (
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
                    {activity.contact_link && (
                        <a
                            href={activity.contact_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-[#E11D2E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#c91827]"
                        >
                            Más información <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                    )}
                    <ShareButton url={url} title={activity.title} />
                </div>
            </article>
        </div>
    );
}
