// Contrato agnóstico al banco. Cada adaptador (bac.ts, y en el futuro bi.ts,
// industrial.ts, promerica.ts) implementa BankPromoSource sin que el
// orquestador (scrape-bank-promos.ts), el matching, el upsert, ni la UI
// necesiten saber nada específico de ese banco.

export type RawBankPromo = {
    externalId: string;
    merchantName: string;
    title: string;
    discountText: string;
    termsText: string | null;
    imageUrl: string | null;
    category: string | null;
    sourceUrl: string;
    validFrom: string | null;
    validUntil: string | null;
};

export interface BankPromoSource {
    bank: string;
    fetchRestaurantPromos(): Promise<RawBankPromo[]>;
}
