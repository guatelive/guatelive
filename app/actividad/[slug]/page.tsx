import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { GalleryCarousel } from '@/components/gallery-carousel';
import { MapPin, ExternalLink, Star, Repeat, Ticket } from 'lucide-react';
import { EVENT_CATEGORY_BADGE, EVENT_CATEGORY_ICON, type EventCategory } from '@/lib/event-categories';
import { SchemaMarkup } from '@/components/seo/schema-markup';
import { buildBreadcrumbSchema } from '@/lib/schema-builders';
import { Breadcrumb } from '@/components/breadcrumb';
import { ShareButton } from '@/components/evento/share-button';
import { SITE_URL } from '@/lib/site-config';
import { DetailInfoCard, priceRowContent, type InfoRow } from '@/components/detail-info-card';
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
        .select('title, description, category, zone, image_url, photo_urls')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

    if (!activity) return { title: 'Actividad no encontrada' };

    const description = activity.description ?? `${activity.category} en ${activity.zone} — GuateLive`;
    const ogImages = [activity.image_url, ...(activity.photo_urls ?? [])]
        .filter((url): url is string => !!url)
        .map(url => ({ url }));

    return {
        title: `${activity.title} — GuateLive`,
        description,
        alternates: { canonical: `${SITE_URL}/actividad/${slug}` },
        openGraph: {
            title: activity.title,
            description,
            images: ogImages,
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
    const priceContent = priceRowContent(activity);
    const infoRows: InfoRow[] = [
        ...(activity.recurrence_text ? [{ icon: Repeat, label: 'Cuándo', content: activity.recurrence_text }] : []),
        {
            icon: MapPin,
            label: 'Lugar',
            content: (
                <>
                    {activity.places ? (
                        <Link href={`/lugar/${activity.places.slug}`} className="font-medium hover:underline">
                            {activity.places.name}
                        </Link>
                    ) : activity.venue_name ? (
                        <span className="font-medium">{activity.venue_name}</span>
                    ) : null}
                    <span className="block text-[#666666]">{activity.zone}</span>
                </>
            ),
        },
        ...(priceContent ? [{ icon: Ticket, label: activity.price_tiers.length > 0 ? 'Precios' : 'Precio', content: priceContent }] : []),
    ];
    const url = `${SITE_URL}/actividad/${activity.slug}`;

    const seenPhotoUrls = new Set<string>();
    const galleryPhotos = [activity.image_url, ...(activity.photo_urls ?? [])]
        .filter((u): u is string => !!u && !seenPhotoUrls.has(u) && !!seenPhotoUrls.add(u))
        .map(photoUrl => ({ url: photoUrl }));

    // Sin `@type: Event` acá — una actividad evergreen no tiene startDate real, y
    // schema.org lo exige para Event. BreadcrumbList no fabrica nada. Ver ADR-023.
    const breadcrumbItems = [
        { name: 'Inicio', url: SITE_URL },
        { name: 'Actividades', url: `${SITE_URL}/actividades` },
        { name: activity.title, url },
    ];
    const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems);

    return (
        <div className="min-h-screen bg-white">
            <SchemaMarkup schema={breadcrumbSchema} />
            <article className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
                <Breadcrumb items={breadcrumbItems} className="mb-6" />

                {/* Galería — carrusel con crossfade/swipe en mobile, collage en desktop,
                    igual que /lugar/[slug] (GalleryCarousel). Sin foto: placeholder de
                    ícono de categoría, igual que antes. */}
                {galleryPhotos.length > 0 ? (
                    <GalleryCarousel photos={galleryPhotos} altLabel="actividad" />
                ) : (
                    <div className="relative mb-6 h-64 w-full overflow-hidden rounded-2xl bg-[#1A1A1A] sm:h-80">
                        <div className="flex h-full items-center justify-center">
                            <PlaceholderIcon className="h-16 w-16" style={{ color: 'rgba(255,255,255,0.15)' }} />
                        </div>
                    </div>
                )}

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

                        <h1 className="font-serif text-3xl font-bold leading-tight text-[#0A0A0A] lg:text-5xl">
                            {activity.title}
                        </h1>
                    </header>

                    <aside className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
                        <div className="lg:sticky lg:top-24">
                            <DetailInfoCard
                                rows={infoRows}
                                footer={
                                    <>
                                        {activity.contact_link && (
                                            <a
                                                href={activity.contact_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#E11D2E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#c91827]"
                                            >
                                                Más información <ExternalLink className="h-3.5 w-3.5" />
                                            </a>
                                        )}
                                        <ShareButton
                                            url={url}
                                            title={activity.title}
                                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E5E5E5] px-6 py-3 text-sm font-semibold text-[#0A0A0A] hover:bg-[#FAFAFA]"
                                        />
                                    </>
                                }
                            />
                        </div>
                    </aside>

                    <div className="lg:col-start-1 lg:row-start-2">
                        {activity.description && (
                            <section className="mb-6">
                                <h2 className="mb-3 font-serif text-xl font-bold text-[#0A0A0A]">Sobre la actividad</h2>
                                <p className="whitespace-pre-line text-[15px] leading-7 text-[#333333]">
                                    {activity.description}
                                </p>
                            </section>
                        )}

                        {activity.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
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
                    </div>
                </div>
            </article>
        </div>
    );
}
