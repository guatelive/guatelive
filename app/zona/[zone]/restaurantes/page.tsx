import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PlaceCard } from '@/components/cards/place-card';
import { createBuildTimeClient } from '@/lib/supabase/server';
import { getPublishedPlaceZones } from '@/lib/zones';
import { SchemaMarkup } from '@/components/seo/schema-markup';
import { buildBreadcrumbSchema, buildFAQSchema, buildPlaceListSchema } from '@/lib/schema-builders';
import { SITE_URL } from '@/lib/site-config';

type Params = Promise<{ zone: string }>;
type PhotoRow = { url: string; is_primary: boolean; order_index: number };

export const revalidate = 3600;

export async function generateStaticParams() {
    const zones = await getPublishedPlaceZones();
    return zones.map((z) => ({ zone: z.slug }));
}

export async function generateMetadata(props: { params: Params }) {
    const params = await props.params;
    const zones = await getPublishedPlaceZones();
    const zoneName = zones.find((z) => z.slug === params.zone)?.zone ?? params.zone;

    return {
        title: `Restaurantes, cafés y bares en ${zoneName} - GuateLive`,
        description: `Descubre los mejores restaurantes, cafés y bares en ${zoneName}, Guatemala.`,
    };
}

export default async function ZonaRestaurantesPage(props: { params: Params }) {
    const params = await props.params;
    const zones = await getPublishedPlaceZones();
    const zoneInfo = zones.find((z) => z.slug === params.zone);

    if (!zoneInfo) {
        notFound();
    }

    const supabase = createBuildTimeClient();
    const { data: placesRaw, error } = await supabase
        .from('places')
        .select('*, place_photos(url, is_primary, order_index)')
        .eq('zone', zoneInfo.zone)
        .eq('is_published', true)
        .order('rating', { ascending: false })
        .limit(60);

    const places = (placesRaw ?? []).map((p: any) => {
        const { place_photos, ...rest } = p;
        const photos = (place_photos ?? []) as PhotoRow[];
        return {
            ...rest,
            primary_photo_url: photos.find((ph) => ph.is_primary)?.url
                ?? [...photos].sort((a, b) => a.order_index - b.order_index)[0]?.url
                ?? null,
        };
    });

    const faqs: { question: string; answer: string }[] = [];

    if (places.length > 0) {
        faqs.push({
            question: `¿Cuántos restaurantes, cafés y bares hay en ${zoneInfo.zone}?`,
            answer: `${places.length} lugares verificados en GuateLive en ${zoneInfo.zone}.`,
        });
    }

    const topRated = places.find((p) => typeof p.rating === 'number');
    if (topRated) {
        faqs.push({
            question: `¿Cuál es el lugar mejor calificado en ${zoneInfo.zone}?`,
            answer: `${topRated.name}, con ${topRated.rating} de calificación según reseñas de Google.`,
        });
    }

    const priceRanges = new Set(places.map((p) => p.price_range).filter(Boolean));
    if (priceRanges.size > 0) {
        const hasEconomico = priceRanges.has('$') || priceRanges.has('$$');
        faqs.push({
            question: `¿Hay opciones económicas en ${zoneInfo.zone}?`,
            answer: hasEconomico
                ? `Sí, hay opciones económicas en ${zoneInfo.zone}.`
                : `La mayoría de lugares en ${zoneInfo.zone} son de precio medio-alto a alto.`,
        });
    }

    const breadcrumbSchema = buildBreadcrumbSchema([
        { name: 'Inicio', url: SITE_URL },
        { name: zoneInfo.zone, url: `${SITE_URL}/zona/${zoneInfo.slug}/restaurantes` },
    ]);
    const faqSchema = buildFAQSchema(faqs);
    const placeListSchema = buildPlaceListSchema(places);

    return (
        <div className="container mx-auto px-4 py-12">
            <SchemaMarkup schema={[breadcrumbSchema, ...(faqSchema ? [faqSchema] : []), ...(placeListSchema ? [placeListSchema] : [])]} />
            <h1 className="text-4xl font-bold mb-2">
                Restaurantes, cafés y bares en {zoneInfo.zone}
            </h1>
            <p className="text-muted-foreground mb-8">
                {places.length} lugares encontrados
            </p>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-8">
                    Error: {error.message}
                </div>
            )}

            {places.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {places.map(place => (
                        <Link
                            key={place.id}
                            href={`/lugar/${place.slug}`}
                            className="block hover:opacity-90 transition-opacity"
                        >
                            <PlaceCard place={place} />
                        </Link>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground">
                    No hay lugares en {zoneInfo.zone}
                </p>
            )}
        </div>
    );
}
