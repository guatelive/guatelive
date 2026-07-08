import { SiteLayout } from '@/components/layout/site-layout';
import { PromoCard } from '@/components/cards/promo-card';
import { SchemaMarkup } from '@/components/seo/schema-markup';
import { buildBreadcrumbSchema, buildOfferSchema } from '@/lib/schema-builders';
import { createBuildTimeClient } from '@/lib/supabase/server';
import { SITE_URL } from '@/lib/site-config';
import { resolvePromoPlaces } from '@/lib/promo-place-match';
import type { DbBankPromotion } from '@/lib/types';

export const revalidate = 3600;

export const metadata = {
    title: 'Promos bancarias — GuateLive',
    description: 'Descuentos vigentes en restaurantes, cafés y bares de Guatemala con tarjetas BAC Credomatic.',
    alternates: { canonical: `${SITE_URL}/promos` },
};

export default async function PromosPage() {
    const supabase = createBuildTimeClient();
    const [{ data }, { data: placesData }] = await Promise.all([
        supabase
            .from('bank_promotions')
            .select('*')
            .eq('is_active', true)
            .order('discount_pct', { ascending: false, nullsFirst: false })
            .order('valid_until', { ascending: true, nullsFirst: false }),
        supabase.from('places').select('name, slug, zone').eq('is_published', true),
    ]);

    const promos = (data ?? []) as DbBankPromotion[];
    const promoPlaces = resolvePromoPlaces(promos, placesData ?? []);

    const breadcrumbSchema = buildBreadcrumbSchema([
        { name: 'Inicio', url: SITE_URL },
        { name: 'Promos bancarias', url: `${SITE_URL}/promos` },
    ]);

    const itemListSchema = promos.length > 0 ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: promos.map((promo, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: buildOfferSchema(promo),
        })),
    } : null;

    return (
        <SiteLayout>
            <SchemaMarkup schema={[breadcrumbSchema, ...(itemListSchema ? [itemListSchema] : [])]} />
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
                <div className="mb-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E]">
                        Descuentos
                    </p>
                    <div className="mt-2 h-[2px] w-8 bg-[#E11D2E]" />
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-foreground md:text-5xl">
                        Promos bancarias
                    </h1>
                    <p className="mt-3 text-lg text-muted-foreground">
                        Descuentos vigentes con BAC Credomatic en restaurantes, cafés y bares de Guatemala.
                    </p>
                </div>

                {promos.length === 0 ? (
                    <p className="text-muted-foreground">No hay promos vigentes por el momento.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {promos.map((promo) => (
                            <PromoCard key={promo.id} promo={promo} places={promoPlaces.get(promo.id) ?? []} />
                        ))}
                    </div>
                )}
            </div>
        </SiteLayout>
    );
}
