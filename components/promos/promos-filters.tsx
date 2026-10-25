'use client';

import { useMemo, useState } from 'react';
import { PromoCard } from '@/components/cards/promo-card';
import { FilterChipRow, type ChipOption } from '@/components/filters/filter-chip-row';
import { getBankBrand } from '@/lib/bank-brand';
import { PROMO_TYPE_LABELS, promoType, type PromoType } from '@/lib/promo-type';
import type { PromoPlaceLink } from '@/lib/promo-place-match';
import type { DbBankPromotion } from '@/lib/types';

const TYPE_ORDER: PromoType[] = ['percent', 'two-for-one', 'special-price', 'other'];

// `places` llega como objeto (no Map) porque cruza de server a client component.
export function PromosFilters({ promos, places }: { promos: DbBankPromotion[]; places: Record<string, PromoPlaceLink[]> }) {
    const [bank, setBank] = useState<string | null>(null);
    const [type, setType] = useState<string | null>(null);

    // Solo chips con resultados, igual que en /eventos/hoy y /actividades.
    const bankOptions: ChipOption[] = useMemo(
        () => [...new Set(promos.map(p => p.bank))].map(b => ({ value: b, label: getBankBrand(b).label })),
        [promos]
    );
    const typeOptions: ChipOption[] = useMemo(() => {
        const present = new Set(promos.map(promoType));
        return TYPE_ORDER.filter(t => present.has(t)).map(t => ({ value: t, label: PROMO_TYPE_LABELS[t] }));
    }, [promos]);

    const filtered = useMemo(
        () => promos.filter(p => (!bank || p.bank === bank) && (!type || promoType(p) === type)),
        [promos, bank, type]
    );

    return (
        <div>
            {bankOptions.length > 1 && (
                <FilterChipRow label="Banco" allLabel="Todos" options={bankOptions} selected={bank} onSelect={setBank} />
            )}
            {typeOptions.length > 1 && (
                <FilterChipRow label="Tipo de promo" allLabel="Todas" options={typeOptions} selected={type} onSelect={setType} />
            )}

            <div className="mt-4 mb-6 flex items-center gap-4 text-sm text-muted-foreground">
                <span>{filtered.length} promo{filtered.length !== 1 ? 's' : ''}</span>
                {(bank || type) && (
                    <button
                        onClick={() => { setBank(null); setType(null); }}
                        className="underline underline-offset-2 hover:text-foreground"
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>

            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {filtered.map(promo => (
                        <PromoCard key={promo.id} promo={promo} places={places[promo.id] ?? []} />
                    ))}
                </div>
            ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">No hay promos con estos filtros.</p>
            )}
        </div>
    );
}
