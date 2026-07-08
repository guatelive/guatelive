// Resuelve, en memoria, qué lugares publicados corresponden a cada promo de
// banco — sin acceso a DB (el fetch de `places` y `bank_promotions` vive en
// los Server Components que llaman a esto). Una promo puede resolver a 0
// lugares (sin match), 1 (link directo) o varios (cadena con múltiples
// sucursales, ej. Tre Fratelli).
//
// Los nombres en `places` NO siguen la convención "Cadena • Sucursal" de forma
// consistente — de las 8 sucursales reales de Tre Fratelli, solo 4 usan "•"
// ("Tre Fratelli • Cayalá"); las otras 4 concatenan la sucursal directo
// ("Tre Fratelli Zona 14", sin separador). Por eso el match real es en 2
// pasos, del más al menos específico:
//   1. slug completo del lugar === merchant_slug de la promo (sucursal única,
//      ej. BIBA, DENNY'S)
//   2. slug completo del lugar EMPIEZA con "merchant_slug-" (cubre tanto
//      "Marca • Sucursal" como "Marca Sucursal" concatenado — slugify()
//      colapsa el "•" a un guion igual que cualquier separador, así que el
//      slug completo de "Tre Fratelli • Cayalá" ya es
//      "tre-fratelli-cayala", que empieza con "tre-fratelli-")
// El paso 2 es un prefijo exacto, no fuzzy matching — "tre-fratelli" no
// matchea nada que no empiece literalmente con "tre-fratelli-".

import { slugify } from '@/lib/slug';

export type PromoPlaceLink = { slug: string; name: string; zone: string };

export function matchesBrand(placeName: string, merchantSlug: string): boolean {
    const fullSlug = slugify(placeName);
    return fullSlug === merchantSlug || fullSlug.startsWith(`${merchantSlug}-`);
}

export function resolvePromoPlaces(
    promos: { id: string; merchant_slug: string | null }[],
    places: PromoPlaceLink[]
): Map<string, PromoPlaceLink[]> {
    const result = new Map<string, PromoPlaceLink[]>();
    for (const promo of promos) {
        if (!promo.merchant_slug) continue;
        const matches = places.filter((place) => matchesBrand(place.name, promo.merchant_slug!));
        if (matches.length > 0) result.set(promo.id, matches);
    }
    return result;
}
