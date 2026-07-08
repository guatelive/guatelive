// El título scrapeado de BAC sigue el patrón "DESCRIPCIÓN - COMERCIO" en
// mayúsculas sostenidas (ej. "40% DE DESCUENTO EN CREPE DE NUTELLA - SAÚL").
// El comercio ya se muestra aparte (promo.merchant_name) — esto separa la
// descripción real de la promo y la pasa a texto legible en vez de mayúsculas
// gritadas. Mismo regex que ya usa scripts/bank-sources/bac.ts para extraer
// merchantName del mismo título, aplicado en sentido inverso (lo que queda
// antes del guion).
export function promoDescription(title: string): string {
    const withoutMerchantSuffix = title.replace(/\s-\s(.+)$/, '').trim();
    return toSentenceCase(withoutMerchantSuffix || title);
}

function toSentenceCase(text: string): string {
    const lower = text.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
}
