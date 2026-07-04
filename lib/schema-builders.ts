import { SITE_URL } from '@/lib/site-config';

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
