import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import GalleryClient from './GalleryClient';
import { TagsBadges } from './TagsBadges';
import { HorariosAccordion } from './HorariosAccordion';
import { ContactSidebar } from './ContactSidebar';
import { ReviewCard } from './ReviewCard';
import { SchemaMarkup } from '@/components/seo/schema-markup';
import { parseHoursRange } from '@/lib/hours-utils';
import { SITE_URL } from '@/lib/site-config';

export const revalidate = 3600;

type Params = Promise<{ slug: string }>;

type Review = {
    author: string;
    rating: number;
    text: string;
    time?: number;                        // Unix timestamp de Google
    relative_time_description?: string;   // "hace 3 meses"
};

type PlacePhoto = {
    url: string;
    is_primary: boolean;
    order_index: number;
};

type PlaceSchemaFields = {
    name: string;
    slug: string;
    description: string | null;
    address: string | null;
    zone: string | null;
    phone: string | null;
    price_range: string | null;
    primary_category: string | null;
    category: string | null;
    rating: number | null;
    rating_count: number | null;
    hours: unknown;
};

type HoursRecord = Record<string, string>;

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const EN_TO_ES: Record<string, string> = {
    monday: 'lunes', tuesday: 'martes', wednesday: 'miércoles',
    thursday: 'jueves', friday: 'viernes', saturday: 'sábado', sunday: 'domingo',
};

function createSb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

function normalizeHours(raw: unknown): HoursRecord | null {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const obj = raw as Record<string, unknown>;

    if (Object.keys(obj).some((k) => DAY_NAMES.includes(k))) {
        return obj as HoursRecord;
    }

    if (Array.isArray(obj.weekday_text)) {
        const result: HoursRecord = {};
        (obj.weekday_text as string[]).forEach((line) => {
            const colonIdx = line.indexOf(':');
            if (colonIdx > 0) {
                const rawDay = line.slice(0, colonIdx).toLowerCase().trim();
                const day = EN_TO_ES[rawDay] ?? rawDay;
                result[day] = line.slice(colonIdx + 1).trim();
            }
        });
        return result;
    }

    return null;
}

function renderStars(rating: number): string {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

export async function generateStaticParams() {
    const supabase = createSb();
    const { data } = await supabase
        .from('places')
        .select('slug')
        .eq('is_published', true);
    return (data ?? []).map(({ slug }: { slug: string }) => ({ slug }));
}

export async function generateMetadata(props: { params: Params }) {
    const { slug } = await props.params;
    const supabase = createSb();
    const { data: place } = await supabase
        .from('places')
        .select('id, name, address, description')
        .eq('slug', slug)
        .single();

    if (!place) return { title: 'Lugar no encontrado' };

    const { data: primaryPhoto } = await supabase
        .from('place_photos')
        .select('url, is_primary, order_index')
        .eq('place_id', place.id)
        .order('is_primary', { ascending: false })
        .order('order_index', { ascending: true })
        .limit(1)
        .single();

    return {
        title: `${place.name} — GuateLive`,
        description: place.description ?? `Descubre ${place.name} en GuateLive`,
        alternates: { canonical: `${SITE_URL}/lugar/${slug}` },
        openGraph: {
            title: place.name,
            description: place.description ?? place.address ?? '',
            images: primaryPhoto?.url ? [{ url: primaryPhoto.url }] : [],
            type: 'website',
        },
    };
}

const DAY_TO_SCHEMA: Record<string, string> = {
    lunes: 'Monday', martes: 'Tuesday', miércoles: 'Wednesday',
    jueves: 'Thursday', viernes: 'Friday', sábado: 'Saturday', domingo: 'Sunday',
};

function schemaTypeForCategory(primaryCategory: string | null, category: string | null): string {
    const text = `${primaryCategory ?? ''} ${category ?? ''}`.toLowerCase();
    if (text.includes('bar')) return 'BarOrPub';
    if (text.includes('café') || text.includes('cafe') || text.includes('coffee')) return 'CafeOrCoffeeShop';
    return 'Restaurant';
}

function buildPlaceSchema(place: PlaceSchemaFields, imageUrl: string | null) {
    const hours = normalizeHours(place.hours);
    const openingHoursSpecification = hours
        ? Object.entries(hours)
            .map(([day, hoursStr]) => {
                const dayOfWeek = DAY_TO_SCHEMA[day];
                const range = dayOfWeek ? parseHoursRange(hoursStr) : null;
                if (!dayOfWeek || !range) return null;
                return {
                    '@type': 'OpeningHoursSpecification',
                    dayOfWeek: `https://schema.org/${dayOfWeek}`,
                    opens: range.opens,
                    closes: range.closes,
                };
            })
            .filter((spec): spec is NonNullable<typeof spec> => spec !== null)
        : [];

    const hasRating = typeof place.rating === 'number' && typeof place.rating_count === 'number' && place.rating_count > 0;

    return {
        '@context': 'https://schema.org',
        '@type': schemaTypeForCategory(place.primary_category, place.category),
        name: place.name,
        url: `${SITE_URL}/lugar/${place.slug}`,
        ...(imageUrl ? { image: imageUrl } : {}),
        ...(place.description ? { description: place.description } : {}),
        ...(place.address ? {
            address: {
                '@type': 'PostalAddress',
                streetAddress: place.address,
                addressLocality: place.zone ? `${place.zone}, Ciudad de Guatemala` : 'Ciudad de Guatemala',
                addressCountry: 'GT',
            },
        } : {}),
        ...(place.phone ? { telephone: place.phone } : {}),
        ...(place.price_range ? { priceRange: place.price_range } : {}),
        ...(hasRating ? {
            aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: place.rating,
                reviewCount: place.rating_count,
            },
        } : {}),
        ...(openingHoursSpecification.length > 0 ? { openingHoursSpecification } : {}),
    };
}

export default async function LugarPage(props: { params: Params }) {
    const { slug } = await props.params;
    const supabase = createSb();

    const { data: place } = await supabase
        .from('places')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

    if (!place) notFound();

    const { data: placePhotosRaw } = await supabase
        .from('place_photos')
        .select('url, is_primary, order_index')
        .eq('place_id', place.id)
        .order('order_index', { ascending: true })
        .limit(10);

    const seen = new Set<string>();
    const placePhotos = (placePhotosRaw ?? []).filter((p): p is PlacePhoto =>
        !seen.has(p.url) && !!seen.add(p.url)
    );

    const galleryPhotos: PlacePhoto[] =
        placePhotos.length > 0
            ? placePhotos
            : [{ url: 'https://images.unsplash.com/photo-1555939594-58d7cb561404?w=1200&h=800&fit=crop', is_primary: true, order_index: 0 }];

    const allReviews = (place.reviews_snapshot ?? []) as Review[];
    const hours = normalizeHours(place.hours);
    const todayName = DAY_NAMES[new Date(Date.now() - 6 * 60 * 60 * 1000).getDay()];

    // Filtrar reseñas de IA (>500 chars) y vacías/muy cortas (<50 chars)
    const reviews = allReviews.filter(
        (r) => r.text && r.text.length >= 50 && r.text.length <= 500
    );

    // 1 reseña como quote si no hay description, el resto van a "Lo que dicen"
    const fallbackReview = !place.description && reviews.length > 0 ? reviews[0] : null;
    const loQueDicen = fallbackReview ? reviews.slice(1, 4) : reviews.slice(0, 3);

    const whatsappNumber = place.phone
        ? place.phone.replace(/\D/g, '').replace(/^0/, '')
        : null;
    const whatsappUrl = whatsappNumber ? `https://wa.me/502${whatsappNumber}` : null;

    const tags = (place.tags ?? []) as string[];
    const schema = buildPlaceSchema(place, galleryPhotos[0]?.url ?? null);

    return (
        <div className="min-h-screen bg-white">
            <SchemaMarkup schema={schema} />
            <div className="mx-auto px-8 py-8" style={{ maxWidth: '1150px' }}>

                <Link
                    href="/"
                    className="inline-flex items-center gap-1 text-sm text-[#666666] hover:text-[#0A0A0A] mb-8 transition-colors"
                >
                    ← Seguir explorando
                </Link>

                {/* GALERÍA — full width, collage */}
                <GalleryClient photos={galleryPhotos} />

                {/* IDENTIDAD — full width */}
                {place.primary_category && (
                    <p className="text-xs uppercase tracking-widest text-[#E11D2E] font-semibold mb-1">
                        {place.primary_category}
                    </p>
                )}

                <h1 className="font-serif text-3xl font-bold text-[#0A0A0A] leading-tight mb-3">
                    {place.name}
                </h1>

                <div className="flex flex-wrap items-center gap-3 mb-2">
                    {place.rating && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-[#E11D2E] text-base leading-none">
                                {renderStars(place.rating)}
                            </span>
                            <span className="font-semibold text-[#0A0A0A] text-sm">
                                {place.rating.toFixed(1)}
                            </span>
                            {place.rating_count && (
                                <span className="text-sm text-[#666666]">
                                    ({place.rating_count.toLocaleString()})
                                </span>
                            )}
                        </div>
                    )}
                    {place.price_range && (
                        <span className="text-sm font-medium text-[#0A0A0A] border border-[#E5E5E5] px-2 py-0.5 rounded">
                            {place.price_range}
                        </span>
                    )}
                </div>

                {place.zone && (
                    <div className="flex items-center gap-1.5 text-sm text-[#666666] mb-5">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{place.zone}</span>
                        {place.address && <span>— {place.address}</span>}
                    </div>
                )}

                {tags.length > 0 && <TagsBadges tags={tags} />}

                {/* Mobile: cards lado a lado debajo de tags */}
                <div
                    className="mobile-only mb-6"
                    style={{ gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'start' }}
                >
                    <HorariosAccordion hours={hours} todayName={todayName} compact />
                    <ContactSidebar
                        address={place.address ?? null}
                        phone={place.phone ?? null}
                        googleMapsUrl={place.google_maps_url ?? null}
                        whatsappUrl={whatsappUrl}
                        website={place.website ?? null}
                        compact
                    />
                </div>

                {/* SECCIÓN DE 2 COLUMNAS: contenido + sidebar sticky */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mt-2">

                    {/* ── IZQUIERDA: descripción + reseñas ── */}
                    <div>

                        {/* Descripción o quote */}
                        {(place.description || fallbackReview) && (
                            <div className="mb-6">
                                <h2 className="font-semibold text-base text-[#0A0A0A] mb-3">
                                    Sobre el lugar
                                </h2>
                                {place.description ? (
                                    <p className="text-sm text-[#333333] leading-relaxed">
                                        {place.description}
                                    </p>
                                ) : fallbackReview ? (
                                    <blockquote className="border-l-2 border-[#E11D2E] pl-4 py-1">
                                        <p className="text-sm text-[#333333] leading-relaxed italic">
                                            &ldquo;{fallbackReview.text}&rdquo;
                                        </p>
                                        <footer className="mt-2 flex items-center gap-2 text-xs text-[#666666]">
                                            <span className="font-medium">{fallbackReview.author}</span>
                                            <span className="text-[#E11D2E]">
                                                {'★'.repeat(Math.min(fallbackReview.rating, 5))}
                                            </span>
                                        </footer>
                                    </blockquote>
                                ) : null}
                            </div>
                        )}

                        {/* Reseñas */}
                        {loQueDicen.length > 0 && (
                            <div className="pt-6 border-t border-[#E5E5E5]">
                                <h2 className="font-semibold text-base text-[#0A0A0A] mb-4">
                                    Reseñas
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {loQueDicen.map((review, i) => (
                                        <ReviewCard
                                            key={i}
                                            author={review.author}
                                            rating={review.rating}
                                            text={review.text}
                                            relativeTime={review.relative_time_description}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── DERECHA: horarios + contacto, sticky (solo desktop) ── */}
                    <div className="desktop-only sticky top-6" style={{ flexDirection: 'column', gap: '12px' }}>
                        <HorariosAccordion hours={hours} todayName={todayName} defaultOpen />
                        <ContactSidebar
                            address={place.address ?? null}
                            phone={place.phone ?? null}
                            googleMapsUrl={place.google_maps_url ?? null}
                            whatsappUrl={whatsappUrl}
                            website={place.website ?? null}
                            defaultOpen
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
