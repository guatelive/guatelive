import { SITE_URL } from '@/lib/site-config';
import type { DbBankPromotion } from '@/lib/types';

export function buildOrganizationSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'GuateLive',
        url: SITE_URL,
    };
}

export function buildWebSiteSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'GuateLive',
        url: SITE_URL,
    };
}

export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };
}

export function schemaTypeForCategory(primaryCategory: string | null, category: string | null): string {
    const text = `${primaryCategory ?? ''} ${category ?? ''}`.toLowerCase();
    if (text.includes('bar')) return 'BarOrPub';
    if (text.includes('café') || text.includes('cafe') || text.includes('coffee')) return 'CafeOrCoffeeShop';
    return 'Restaurant';
}

type EditionPlaceRef = {
    name: string;
    slug: string;
    primary_category?: string | null;
} | null | undefined;

function placeToSchemaNode(place: EditionPlaceRef): { '@type': string; url: string } | null {
    if (!place) return null;
    return {
        '@type': schemaTypeForCategory(place.primary_category ?? null, null),
        url: `${SITE_URL}/lugar/${place.slug}`,
    };
}

export function buildEditionReviewSchema(
    edition: { place_rating: number | null; place_verdict: string | null },
    highlightedPlace: EditionPlaceRef
) {
    const placeNode = placeToSchemaNode(highlightedPlace);
    if (!placeNode || typeof edition.place_rating !== 'number') return null;

    return {
        '@context': 'https://schema.org',
        '@type': 'Review',
        itemReviewed: { ...placeNode, name: highlightedPlace?.name },
        reviewRating: {
            '@type': 'Rating',
            ratingValue: edition.place_rating,
            bestRating: 5,
        },
        ...(edition.place_verdict ? { reviewBody: edition.place_verdict } : {}),
        author: {
            '@type': 'Organization',
            name: 'GuateLive',
        },
    };
}

type EditionPlaceEntry = {
    mention_type: string;
    editorial_text: string | null;
    title: string | null;
    places?: EditionPlaceRef;
};

const BANK_DISPLAY_NAMES: Record<string, string> = {
    bac: 'BAC Credomatic',
};

function bankDisplayName(bank: string): string {
    return BANK_DISPLAY_NAMES[bank] ?? bank.toUpperCase();
}

export function buildOfferSchema(promo: DbBankPromotion, place?: EditionPlaceRef) {
    const placeNode = placeToSchemaNode(place);

    return {
        '@context': 'https://schema.org',
        '@type': 'Offer',
        name: promo.title,
        description: promo.discount_label,
        url: promo.source_url,
        ...(promo.image_url ? { image: promo.image_url } : {}),
        ...(promo.valid_from ? { validFrom: promo.valid_from } : {}),
        ...(promo.valid_until ? { validThrough: promo.valid_until } : {}),
        offeredBy: {
            '@type': 'BankOrCreditUnion',
            name: bankDisplayName(promo.bank),
        },
        ...(placeNode ? { itemOffered: { ...placeNode, name: place?.name } } : {}),
    };
}

export function buildEditionItemListSchema(entries: EditionPlaceEntry[]) {
    const items = entries.filter((ep) => ep.mention_type !== 'not_recommended');
    if (items.length === 0) return null;

    return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: items.map((ep, index) => {
            const placeNode = placeToSchemaNode(ep.places);
            const name = ep.title || ep.places?.name || 'Sin título';
            return {
                '@type': 'ListItem',
                position: index + 1,
                item: {
                    ...(placeNode ?? { '@type': 'Thing' }),
                    name,
                    ...(ep.editorial_text ? { description: ep.editorial_text } : {}),
                },
            };
        }),
    };
}
