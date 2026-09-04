import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { SchemaMarkup } from '@/components/seo/schema-markup';
import { ActividadesFilters } from '@/components/actividades/ActividadesFilters';
import { SITE_URL } from '@/lib/site-config';
import type { DbActivity } from '@/lib/types';

export const revalidate = 3600;

export const metadata = {
    title: 'Actividades en Guatemala | GuateLive',
    description: 'Planes casi siempre disponibles en Guatemala: museos, clases, senderos y actividades recurrentes.',
    alternates: { canonical: `${SITE_URL}/actividades` },
};

export default async function ActividadesPage() {
    const supabase = await createClient();
    const { data } = await supabase
        .from('activities')
        .select(`
            id, title, slug, description, category, zone, venue_name,
            place_id, recurrence_text, price, is_free, price_tiers, image_url, contact_link,
            sponsored, featured, tags, status
        `)
        .eq('status', 'published')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(60);

    const activities = (data ?? []) as DbActivity[];

    // Sin `@type: Event` — estas actividades no tienen fecha real, así que un ListItem
    // genérico (sin startDate/eventStatus) evita fabricar datos estructurados que
    // schema.org exige para Event. Ver ADR-023 en docs/decisions.md.
    const itemListSchema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: activities.map((activity, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
                name: activity.title,
                url: `${SITE_URL}/actividad/${activity.slug}`,
                ...(activity.image_url ? { image: activity.image_url } : {}),
                ...(activity.description ? { description: activity.description } : {}),
            },
        })),
    };

    return (
        <div className="mx-auto max-w-6xl px-6 py-10">
            <SchemaMarkup schema={itemListSchema} />

            <Link
                href="/"
                className="mb-4 inline-flex items-center gap-1 text-sm text-[#666666] hover:text-[#0A0A0A] transition-colors"
            >
                ← Volver a inicio
            </Link>

            <h1 className="font-serif text-3xl font-bold text-[#0A0A0A] mb-2">
                Actividades en Guatemala
            </h1>
            <p className="text-sm text-[#666666] mb-8">
                Planes casi siempre disponibles — museos, clases y senderos que no dependen de una fecha puntual.
            </p>

            {activities.length > 0 ? (
                <ActividadesFilters activities={activities} />
            ) : (
                <p className="text-center text-sm text-[#666666] py-12">
                    Todavía no hay actividades publicadas. Volvé pronto.
                </p>
            )}
        </div>
    );
}
