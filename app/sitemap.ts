import type { MetadataRoute } from 'next';
import { createBuildTimeClient } from '@/lib/supabase/server';
import { SITE_URL } from '@/lib/site-config';

export const revalidate = 3600;

// Mismas 6 zonas de app/zona/[zone]/restaurantes/page.tsx (ZONE_MAP) — esa página existe desde
// el primer commit pero no está linkeada desde ningún lado, así que sin esto Google no tiene
// forma de descubrirla.
const LONG_TAIL_ZONES = ['zona-10', 'zona-4', 'zona-14', 'zona-15', 'cayala', 'antigua'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = createBuildTimeClient();

    const [{ data: places }, { data: editions }, { data: events }] = await Promise.all([
        supabase.from('places').select('slug, last_synced_at, created_at').eq('is_published', true),
        supabase.from('editions').select('slug, published_at, created_at').eq('status', 'published'),
        supabase.from('events').select('slug, date_start').eq('status', 'published'),
    ]);

    const staticRoutes: MetadataRoute.Sitemap = [
        { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
        { url: `${SITE_URL}/buscar`, changeFrequency: 'daily', priority: 0.6 },
        { url: `${SITE_URL}/eventos/hoy`, changeFrequency: 'daily', priority: 0.8 },
        { url: `${SITE_URL}/edicion`, changeFrequency: 'weekly', priority: 0.6 },
        ...LONG_TAIL_ZONES.map((zone) => ({
            url: `${SITE_URL}/zona/${zone}/restaurantes`,
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        })),
    ];

    const placeRoutes: MetadataRoute.Sitemap = (places ?? []).map((place) => ({
        url: `${SITE_URL}/lugar/${place.slug}`,
        lastModified: place.last_synced_at ?? place.created_at ?? undefined,
        changeFrequency: 'weekly',
        priority: 0.7,
    }));

    const editionRoutes: MetadataRoute.Sitemap = (editions ?? []).map((edition) => ({
        url: `${SITE_URL}/edicion/${edition.slug}`,
        lastModified: edition.published_at ?? edition.created_at ?? undefined,
        changeFrequency: 'monthly',
        priority: 0.7,
    }));

    const eventRoutes: MetadataRoute.Sitemap = (events ?? []).map((event) => ({
        url: `${SITE_URL}/evento/${event.slug}`,
        lastModified: event.date_start ?? undefined,
        changeFrequency: 'weekly',
        priority: 0.6,
    }));

    return [...staticRoutes, ...placeRoutes, ...editionRoutes, ...eventRoutes];
}
