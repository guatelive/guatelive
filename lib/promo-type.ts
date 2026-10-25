import type { DbBankPromotion } from '@/lib/types';

// Tipo de promo para el filtro de /promos. Los bancos no lo exponen como dato: se
// deduce de discount_pct y del texto (title + discount_label). El orden de las reglas
// importa: "2x Q125" es precio especial (dos platillos por Q125), no un 2x1.
export type PromoType = 'percent' | 'two-for-one' | 'special-price' | 'other';

export const PROMO_TYPE_LABELS: Record<PromoType, string> = {
    percent: '% Descuento',
    'two-for-one': '2x1',
    'special-price': 'Precio especial',
    other: 'Cortesías y otros',
};

export function promoType(promo: Pick<DbBankPromotion, 'discount_pct' | 'title' | 'discount_label'>): PromoType {
    const text = `${promo.title} ${promo.discount_label}`;
    if (promo.discount_pct !== null) return 'percent';
    if (/\b2\s*x\s*1\b/i.test(text)) return 'two-for-one';
    if (/precio|tarifa|por solo|\b\d\s*x\s*Q\s*\d|mitad de precio|\bQ\s*\d/i.test(text)) return 'special-price';
    return 'other';
}
